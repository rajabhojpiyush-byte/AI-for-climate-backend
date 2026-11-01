"""
ResQAI — AI response validation + failure handling (tasks 4 and 5)

This module does NOT talk to any AI service itself. It wraps whatever
"provider" function you give it (Nugen, or a fake one for tests) and makes
sure the rest of the system only ever sees a clean, validated result:

  - Invalid JSON, JSON hidden inside extra text or ```code fences```  -> handled
  - Incomplete responses (missing fields) or bad values               -> rejected + retried
  - API errors, timeouts, crashes                                     -> retried
  - Still failing after all attempts                                  -> safe fallback:
        needs_human_review = True (the report is never lost or crashed on)

A provider is any function:   provider(description, image_path) -> str
that returns the AI's raw text answer. To use Nugen later, you only write
that one function; nothing else here changes.
"""

import json
import re
import time
from typing import Callable, Optional

from pydantic import BaseModel, Field, ValidationError, field_validator

# ---------- Allowed values (extend as needed) ----------
DISASTER_TYPES = {
    "flood", "fire", "landslide", "cyclone", "storm", "earthquake", "heatwave", "other",
}

# Looser labels the AI may use -> our fixed names (checked in this order)
_TYPE_PATTERNS = [
    ("earthquake", ("earthquake", "quake", "seismic", "tremor")),
    ("landslide", ("landslide", "landslip", "mudslide", "rockfall")),
    ("flood", ("flood", "inundat", "waterlog")),
    ("fire", ("fire", "blaze")),
    ("cyclone", ("cyclone", "hurricane", "typhoon")),
    ("storm", ("storm",)),
    ("heatwave", ("heatwave", "heat wave", "extreme heat")),
]


def normalize_disaster_type(value):
    """'Flood / Water Inundation' -> 'flood'. Raises ValueError if unrecognised."""
    v = str(value).strip().lower()
    if v in DISASTER_TYPES:
        return v
    if v in ("unknown", "none", "n/a"):
        return "other"
    for name, patterns in _TYPE_PATTERNS:
        if any(p in v for p in patterns):
            return name
    raise ValueError(f"unknown disaster_type '{value}'")
SEVERITIES = {"low": "Low", "medium": "Medium", "moderate": "Medium",
              "high": "High", "critical": "Critical"}

# Results below this confidence are sent to a human instead of trusted
LOW_CONFIDENCE_THRESHOLD = 50.0


class AIResponseError(Exception):
    """The AI answered, but the answer is unusable."""


class AIAnalysis(BaseModel):
    """The exact shape every AI answer must have."""
    disaster_type: str
    severity: str
    confidence: float = Field(ge=0, le=100)
    reasoning: str = Field(min_length=1)
    # Does the image match what the text says? None = no image / unsure.
    image_consistent: Optional[bool] = None
    # The AI's own "a human should check this" flag (None = it did not say)
    human_review_required: Optional[bool] = None

    @field_validator("disaster_type")
    @classmethod
    def _check_type(cls, v):
        return normalize_disaster_type(v)

    @field_validator("severity")
    @classmethod
    def _check_severity(cls, v):
        key = v.strip().lower()
        if key not in SEVERITIES:
            raise ValueError(f"unknown severity '{v}'")
        return SEVERITIES[key]


# ---------- Step 1: get JSON out of whatever the AI said ----------

def extract_json(raw):
    """Return a dict from raw AI text, or raise AIResponseError."""
    if raw is None or not str(raw).strip():
        raise AIResponseError("empty response")
    text = str(raw).strip()

    candidates = [text]
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        candidates.append(fenced.group(1).strip())
    first, last = text.find("{"), text.rfind("}")
    if first != -1 and last > first:
        candidates.append(text[first:last + 1])

    for c in candidates:
        try:
            data = json.loads(c)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(data, dict):
            return data
    raise AIResponseError("response is not valid JSON")


# ---------- Step 2: validate the JSON ----------

# The AI is not always consistent about key names, so accept the common ones
_KEY_ALIASES = {
    "disaster_category": "disaster_type",
    "category": "disaster_type",
    "explanation": "reasoning",
}


def _normalise_keys(data):
    data = dict(data)
    for alias, real in _KEY_ALIASES.items():
        if real not in data and alias in data:
            data[real] = data.pop(alias)
    # confidence: accept "85%", and treat 0-1 as a fraction (0.9 -> 90)
    c = data.get("confidence")
    if isinstance(c, str):
        c = c.strip().rstrip("%").strip()
        try:
            c = float(c)
        except ValueError:
            return data
    if isinstance(c, (int, float)) and not isinstance(c, bool):
        if 0 < c <= 1:
            c = c * 100
        data["confidence"] = c
    return data


def parse_ai_response(raw):
    """Raw AI text -> validated AIAnalysis, or raise AIResponseError."""
    data = _normalise_keys(extract_json(raw))
    try:
        return AIAnalysis(**data)
    except ValidationError as e:
        problems = "; ".join(
            f"{'.'.join(str(p) for p in err['loc'])}: {err['msg']}" for err in e.errors()
        )
        raise AIResponseError(f"incomplete or invalid fields -> {problems}")


# ---------- Step 3: call the AI safely ----------

def analyze(
    provider: Callable[[str, Optional[str]], str],
    description: str,
    image_path: Optional[str] = None,
    max_attempts: int = 3,
    delay_seconds: float = 0,
):
    """
    Run one report through the AI safely. Never raises.

    Returns a dict:
      ok                 True if we got a valid AI answer
      analysis           the validated answer as a dict (None if ok is False)
      needs_human_review True if a person must look at it, and why:
      review_reasons     list of reasons (AI failed / low confidence / image mismatch)
      attempts           how many tries were used
      errors             what went wrong on each failed try
    """
    errors = []
    for attempt in range(1, max_attempts + 1):
        try:
            raw = provider(description, image_path)
            result = parse_ai_response(raw)
        except AIResponseError as e:
            errors.append(f"attempt {attempt}: bad response - {e}")
        except Exception as e:  # API down, timeout, network, anything else
            errors.append(f"attempt {attempt}: API failure - {type(e).__name__}: {e}")
        else:
            reasons = []
            if result.confidence < LOW_CONFIDENCE_THRESHOLD:
                reasons.append(f"low confidence ({result.confidence})")
            if result.image_consistent is False:
                reasons.append("image does not match the description")
            if result.human_review_required is True:
                reasons.append("AI asked for human review")
            return {
                "ok": True,
                "analysis": result.model_dump(),
                "needs_human_review": bool(reasons),
                "review_reasons": reasons,
                "attempts": attempt,
                "errors": errors,
            }
        if attempt < max_attempts and delay_seconds:
            time.sleep(delay_seconds)

    # Every attempt failed: safe fallback
    return {
        "ok": False,
        "analysis": None,
        "needs_human_review": True,
        "review_reasons": ["AI analysis unavailable"],
        "attempts": max_attempts,
        "errors": errors,
    }

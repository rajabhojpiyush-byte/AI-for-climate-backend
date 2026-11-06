"""
ResQAI — Safe wrapper around Nugen text and multi-modal disaster analysis

Includes:
  - Text report validation (detects jokes, pranks, metaphors, spam, irrelevant text)
  - Image verification and visual feature interpretation (Pillow, color/edge cues)
  - Cleaned AI responses (types, severity names, confidence 0-100)
  - Automatic retries on API timeout or failure
  - Safe fallbacks when offline or AI unavailable
"""

from typing import Callable, Optional, Dict, Any

from ai_analysis import analyze
from ai.disaster_validator import check_heuristics
from ai.image_verifier import interpret_disaster_image


def _default_call_ai(description: str) -> str:
    # Imported here so tests can run without requests / python-dotenv / a .env file
    from ai.nugen_client import analyze_disaster_report
    return analyze_disaster_report(description)


def _keyword_guess(description: str) -> Optional[str]:
    """Type guess from the keyword classifier. Only used when the AI has failed."""
    try:
        from ai.text.text_classifier import classify_text
        guess = classify_text(description)["disaster_type"]
    except Exception:
        return None
    return None if guess == "unknown" else guess


def _priority_score(severity):
    """Priority score from the existing ai/priority.py. None if severity is unknown."""
    if not severity:
        return None
    try:
        from ai.priority import calculate_priority
        return float(calculate_priority(severity)["score"])
    except Exception:
        return None


def analyze_report(
    description: str,
    image_bytes: Optional[bytes] = None,
    image_filename: Optional[str] = None,
    call_ai: Optional[Callable[[str], str]] = None,
    max_attempts: int = 2,
    delay_seconds: float = 1,
) -> Dict[str, Any]:
    """
    Analyzes and validates a disaster report (text description + optional image).

    Returns:
      is_valid               True if genuine disaster report; False if prank/irrelevant
      validation_message     "ok" or user-facing rejection reason
      ai_status              "Success", "Invalid", or "Failed"
      disaster_type          Cleaned type e.g. "flood", "fire", etc.
      severity               Low / Medium / High / Critical, or None if invalid/failed
      confidence             0-100
      priority_score         Calculated priority score (0-100)
      reasoning              Explanation synthesized from text and visual analysis
      visual_interpretation  Detailed image analysis findings (if image provided)
      extracted_tags         List of threat tags (e.g. ['submerged-vehicles', ...])
      human_review_required  True if review is necessary
      review_reasons         List of reasons for review or rejection
    """
    # ----------------- Step 1: Text Heuristic & Prank Validation -----------------
    has_img = bool(image_bytes and len(image_bytes) >= 32)
    is_valid_text, heuristic_type, reject_reason = check_heuristics(description, has_image=has_img)

    if not is_valid_text:
        return {
            "is_valid": False,
            "validation_message": "Please enter a valid disaster report",
            "ai_status": "Invalid",
            "disaster_type": None,
            "severity": None,
            "confidence": 0.0,
            "priority_score": None,
            "reasoning": reject_reason or "Please enter a valid disaster report.",
            "visual_interpretation": None,
            "extracted_tags": [],
            "human_review_required": True,
            "review_reasons": [reject_reason or "Invalid disaster report"],
            "attempts": 0,
            "errors": [],
        }

    # ----------------- Step 2: Image Verification & Interpretation -----------------
    img_data = None
    if image_bytes:
        img_data = interpret_disaster_image(image_bytes, expected_type=heuristic_type)
        if not img_data["is_valid"]:
            return {
                "is_valid": False,
                "validation_message": "Please enter a valid disaster report",
                "ai_status": "Invalid",
                "disaster_type": None,
                "severity": None,
                "confidence": 0.0,
                "priority_score": None,
                "reasoning": img_data["rejection_reason"],
                "visual_interpretation": None,
                "extracted_tags": [],
                "human_review_required": True,
                "review_reasons": [img_data["rejection_reason"]],
                "attempts": 0,
                "errors": [],
            }

    # ----------------- Step 3: AI Model Call -----------------
    call = call_ai or _default_call_ai
    outcome = analyze(
        lambda text, _image: call(text),
        description,
        image_path=image_filename,
        max_attempts=max_attempts,
        delay_seconds=delay_seconds,
    )

    tags = []

    if outcome["ok"]:
        a = outcome["analysis"]

        # Check if AI model explicitly rejected as prank or invalid disaster
        is_prank_or_joke = (
            a.get("is_valid_disaster") is False and (
                a.get("disaster_type") in ("none", "other", "unknown", None)
                or "joke" in str(a.get("reasoning", "")).lower()
                or "prank" in str(a.get("reasoning", "")).lower()
                or "metaphor" in str(a.get("reasoning", "")).lower()
                or "irrelevant" in str(a.get("reasoning", "")).lower()
            )
        )
        if is_prank_or_joke:
            return {
                "is_valid": False,
                "validation_message": "Please enter a valid disaster report",
                "ai_status": "Invalid",
                "disaster_type": None,
                "severity": None,
                "confidence": 0.0,
                "priority_score": None,
                "reasoning": a.get("reasoning") or "Please enter a valid disaster report.",
                "visual_interpretation": None,
                "extracted_tags": [],
                "human_review_required": True,
                "review_reasons": ["AI flagged submission as prank or irrelevant"],
                "attempts": outcome["attempts"],
                "errors": outcome["errors"],
            }

        # Build synthesized reasoning and tags
        reasoning = a["reasoning"]
        visual_interp = None
        if img_data and img_data["is_valid"]:
            visual_interp = img_data["visual_interpretation"]
            reasoning = f"{reasoning} {visual_interp}"
            tags.extend(img_data["visual_features"])
        else:
            tags.append("witness-evidence")

        # Threat tags based on disaster type
        dtype = a["disaster_type"] or heuristic_type or "disaster"
        if dtype == "flood":
            tags.extend(["flash-inundation", "water-hazard"])
        elif dtype == "fire":
            tags.extend(["thermal-signature", "combustion-risk"])
        elif dtype == "landslide":
            tags.extend(["geological-displacement", "debris-flow"])
        elif dtype == "earthquake":
            tags.extend(["seismic-tremor", "structural-threat"])
        elif dtype in ("cyclone", "storm"):
            tags.extend(["high-winds", "storm-damage"])

        priority = _priority_score(a["severity"])

        return {
            "is_valid": True,
            "validation_message": "ok",
            "ai_status": "Success",
            "disaster_type": a["disaster_type"],
            "severity": a["severity"],
            "confidence": a["confidence"],
            "priority_score": priority,
            "reasoning": reasoning,
            "visual_interpretation": visual_interp,
            "extracted_tags": list(dict.fromkeys(tags)),
            "human_review_required": outcome["needs_human_review"],
            "review_reasons": outcome["review_reasons"],
            "attempts": outcome["attempts"],
            "errors": outcome["errors"],
        }

    # ----------------- Step 4: AI Failure / Offline Rule Fallback -----------------
    guess = _keyword_guess(description)
    note = "AI analysis unavailable. Manual review required."
    if guess:
        note += f" Keyword guess only: {guess}."

    visual_interp = None
    if img_data and img_data["is_valid"]:
        visual_interp = img_data["visual_interpretation"]
        note += f" {visual_interp}"
        tags.extend(img_data["visual_features"])

    return {
        "is_valid": True,
        "validation_message": "ok",
        "ai_status": "Failed",
        "disaster_type": guess,
        "severity": None,
        "confidence": None,
        "priority_score": None,
        "reasoning": note,
        "visual_interpretation": visual_interp,
        "extracted_tags": list(dict.fromkeys(tags)),
        "human_review_required": True,
        "review_reasons": outcome["review_reasons"],
        "attempts": outcome["attempts"],
        "errors": outcome["errors"],
    }


def analyze_text_report(
    description: str,
    call_ai: Optional[Callable[[str], str]] = None,
    max_attempts: int = 2,
    delay_seconds: float = 1,
) -> dict:
    """
    Backward-compatible text-only analysis function. Never raises.
    """
    return analyze_report(
        description=description,
        image_bytes=None,
        image_filename=None,
        call_ai=call_ai,
        max_attempts=max_attempts,
        delay_seconds=delay_seconds,
    )


def apply_to_report(report, result: dict) -> None:
    """Copy an analyze_report() result onto a Report row (columns that exist)."""
    report.disaster_type = result.get("disaster_type")
    report.severity = result.get("severity")
    report.confidence = result.get("confidence")
    report.priority_score = result.get("priority_score")
    report.ai_reasoning = result.get("reasoning")
    report.human_review_required = result.get("human_review_required", True)

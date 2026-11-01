"""
ResQAI — Safe wrapper around the existing Nugen text analysis

Your partner's ai/nugen_client.py is NOT changed. This wrapper sits around it and:
  - checks and cleans the AI's answer (types, severity names, confidence 0-100)
  - retries once if the answer is unusable or the API fails
  - if the AI still fails, falls back safely: no invented severity or confidence,
    a keyword guess for the type only, and human_review_required = True

Use it in main.py instead of calling analyze_disaster_report() directly:

    ai_result = await asyncio.to_thread(analyze_text_report, description)
    apply_to_report(new_report, ai_result)
"""

from typing import Callable, Optional

from ai_analysis import analyze


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


def analyze_text_report(
    description: str,
    call_ai: Optional[Callable[[str], str]] = None,
    max_attempts: int = 2,
    delay_seconds: float = 1,
) -> dict:
    """
    Analyse one report's text. Never raises.

    Returns:
      ai_status              "Success" or "Failed"
      disaster_type          cleaned type, or a keyword guess / None if the AI failed
      severity               Low / Medium / High / Critical, or None if the AI failed
      confidence             0-100, or None if the AI failed
      reasoning              the AI's explanation (or a note that the AI was unavailable)
      human_review_required  True if the AI failed, is unsure, or asked for a human
      review_reasons, attempts, errors   details for debugging / display
    """
    call = call_ai or _default_call_ai
    outcome = analyze(
        lambda text, _image: call(text),
        description,
        None,
        max_attempts=max_attempts,
        delay_seconds=delay_seconds,
    )

    if outcome["ok"]:
        a = outcome["analysis"]
        return {
            "ai_status": "Success",
            "disaster_type": a["disaster_type"],
            "severity": a["severity"],
            "confidence": a["confidence"],
            "reasoning": a["reasoning"],
            "human_review_required": outcome["needs_human_review"],
            "review_reasons": outcome["review_reasons"],
            "attempts": outcome["attempts"],
            "errors": outcome["errors"],
        }

    guess = _keyword_guess(description)
    note = "AI analysis unavailable. Manual review required."
    if guess:
        note += f" Keyword guess only: {guess}."
    return {
        "ai_status": "Failed",
        "disaster_type": guess,
        "severity": None,
        "confidence": None,
        "reasoning": note,
        "human_review_required": True,
        "review_reasons": outcome["review_reasons"],
        "attempts": outcome["attempts"],
        "errors": outcome["errors"],
    }


def apply_to_report(report, result: dict) -> None:
    """Copy an analyze_text_report() result onto a Report row (columns that exist)."""
    report.disaster_type = result["disaster_type"]
    report.severity = result["severity"]
    report.confidence = result["confidence"]
    report.ai_reasoning = result["reasoning"]
    report.human_review_required = result["human_review_required"]

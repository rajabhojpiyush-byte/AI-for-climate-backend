"""
ResQAI — Enhanced disaster report priority score calculation

Maps severity and report conditions to an operational priority score (0-100).
Supports:
  1. calculate_priority(severity: str) -> dict with 'priority' and 'score'
     (100% backward compatible with existing endpoints & tests)
  2. calculate_priority_score(severity, confidence, is_duplicate, has_image) -> float
     (dynamic formula considering validation confidence and duplicates)
"""

PRIORITY_MAP = {
    "critical": {
        "priority": "urgent",
        "score": 100.0
    },
    "high": {
        "priority": "high",
        "score": 75.0
    },
    "medium": {
        "priority": "normal",
        "score": 50.0
    },
    "moderate": {
        "priority": "normal",
        "score": 50.0
    },
    "low": {
        "priority": "low",
        "score": 25.0
    }
}


def calculate_priority(severity: str) -> dict:
    """
    Standard backward-compatible priority calculation from severity string.
    Returns:
        dict: {"priority": "urgent"|"high"|"normal"|"low", "score": 0.0-100.0}
    """
    if not severity:
        return {"priority": "low", "score": 0.0}

    sev_clean = str(severity).strip().lower()

    if sev_clean not in PRIORITY_MAP:
        return {"priority": "low", "score": 0.0}

    result = PRIORITY_MAP[sev_clean]
    return {
        "priority": result["priority"],
        "score": result["score"]
    }


def calculate_priority_score(
    severity: str,
    confidence: float = None,
    is_duplicate: bool = False,
    has_image: bool = False,
) -> float:
    """
    Refined priority score (0 - 100) taking into account:
      - Baseline severity weight (Critical=100, High=75, Medium=50, Low=25)
      - High confidence bonus (+/- up to 5 points)
      - Attached image bonus (+2 points for verified visual proof)
      - Duplicate penalty (-30 points to push repeats down the triage list)
    """
    base = calculate_priority(severity)["score"]
    if base == 0.0:
        return 0.0

    score = base

    # If it's a confirmed duplicate, reduce queue priority
    if is_duplicate:
        score = max(5.0, score - 30.0)
        return round(score, 1)

    # Confidence factor
    if confidence is not None:
        if confidence >= 80.0:
            score += 3.0
        elif confidence < 50.0:
            score -= 5.0

    # Visual proof factor
    if has_image:
        score += 2.0

    return min(100.0, max(0.0, round(score, 1)))


if __name__ == "__main__":
    for s in ["critical", "high", "medium", "low"]:
        print(s, calculate_priority(s))

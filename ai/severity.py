"""
ResQAI — Enhanced disaster report severity estimation (rule-based)

Calculates severity level based on weighted keyword matching,
word boundaries (preventing false substring matches), and critical
escalation triggers (e.g., casualties, trapped individuals, collapsed structures).
"""

import re

# Severity tiers with associated weights and regex patterns (using word boundaries)
SEVERITY_PATTERNS = {
    "critical": {
        "weight": 4.0,
        "patterns": [
            r"\btrapped\b", r"\bcollapse[ds]?\b", r"\bcollapsing\b",
            r"\bdead\b", r"\bdeath[s]?\b", r"\bfatalit(y|ies)\b",
            r"\bcasualt(y|ies)\b", r"\bcritical\b", r"\bdrowning\b",
            r"\blife[- ]threatening\b", r"\bsuffocat(ing|ed)\b",
            r"\bunconscious\b", r"\brubble\b", r"\bunder debris\b",
            r"\bmassive explosion\b", r"\burgent(ly)?\b",
        ],
    },
    "high": {
        "weight": 2.5,
        "patterns": [
            r"\bflood(ed|ing)?\b", r"\bdestroy(ed|ing)?\b", r"\binjur(ed|ies|y)\b",
            r"\bheavy damage\b", r"\bsubmerged\b", r"\bevacuat(e|ed|ion|ing)\b",
            r"\bhospital(ized)?\b", r"\bsevere\b", r"\braging\b",
            r"\broof[s]? blown\b", r"\bblaze\b", r"\bstranded\b",
            r"\bout of control\b", r"\bflash flood\b", r"\blandslide\b",
        ],
    },
    "medium": {
        "weight": 1.5,
        "patterns": [
            r"\bdamage[ds]?\b", r"\bblock(ed|age)?\b", r"\bwaterlog(ged|ging)?\b",
            r"\bdisrupt(ed|ion)\b", r"\bpower outage\b", r"\bcracked\b",
            r"\boverflow(ing|ed)?\b", r"\bknee[- ]deep\b", r"\bheavy rain\b",
            r"\broad closed\b", r"\btraffic halt(ed)?\b", r"\bmoderate\b",
        ],
    },
    "low": {
        "weight": 1.0,
        "patterns": [
            r"\bminor\b", r"\bsmall\b", r"\bslight\b", r"\blittle\b",
            r"\bpuddle[s]?\b", r"\bdrizzle\b", r"\bcleared\b",
            r"\breced(ed|ing)\b", r"\bcontained\b", r"\bsafe\b",
            r"\bunder control\b", r"\bno damage\b", r"\bno injur(ies|y)\b",
        ],
    },
}

# Immediate triggers that force escalation to Critical regardless of other mild words
CRITICAL_ESCALATION_PATTERNS = [
    r"\btrapped\b",
    r"\bcasualt(y|ies)\b",
    r"\bdeath[s]?\b",
    r"\bfatalit(y|ies)\b",
    r"\bcollapsed building\b",
    r"\bpeople under rubble\b",
    r"\bchildren trapped\b",
    r"\bdrowning\b",
]


def calculate_severity(text: str) -> dict:
    """
    Calculate severity level of a disaster report text.
    Returns:
        dict: {
            "severity": "low" | "medium" | "high" | "critical",
            "score": float (weighted score),
            "confidence": float (0.0 to 1.0)
        }
    """
    if not text or not text.strip():
        return {"severity": "low", "score": 0.0, "confidence": 0.0}

    text_lower = text.lower()

    # Check for hard critical escalation first
    has_critical_escalation = any(
        re.search(pat, text_lower) for pat in CRITICAL_ESCALATION_PATTERNS
    )

    scores = {"low": 0.0, "medium": 0.0, "high": 0.0, "critical": 0.0}

    for level, data in SEVERITY_PATTERNS.items():
        for pattern in data["patterns"]:
            if re.search(pattern, text_lower):
                scores[level] += data["weight"]

    if has_critical_escalation:
        scores["critical"] += 10.0

    total_score = sum(scores.values())

    if total_score == 0:
        return {"severity": "low", "score": 0.0, "confidence": 0.0}

    highest_severity = max(scores, key=scores.get)
    highest_score = scores[highest_severity]
    confidence = highest_score / total_score

    return {
        "severity": highest_severity,
        "score": round(highest_score, 2),
        "confidence": round(confidence, 2),
    }


if __name__ == "__main__":
    report = "People are trapped inside a collapsed building."
    print("Test severity:", calculate_severity(report))

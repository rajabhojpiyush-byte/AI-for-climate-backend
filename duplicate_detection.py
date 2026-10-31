"""
ResQAI — Duplicate detection (rule-based, no extra dependencies)

A new report is a likely duplicate of an earlier one when it is:
  1. close in LOCATION   (within RADIUS_M metres)
  2. close in TIME       (within TIME_WINDOW_HOURS hours)
  3. similar in TEXT     (shared keywords in the description)

Location and time are hard gates (outside the radius or window means
"not a duplicate"). Inside them, a weighted score decides. Every result
includes a breakdown, so a human can see WHY a report was flagged.

The core logic works on plain objects (anything with latitude, longitude,
timestamp, description, id and optionally disaster_type), so it can be
tested without a database. Database helpers are at the bottom.
"""

import math
import re
from datetime import timedelta

# ---------- Tunable settings ----------
RADIUS_M = 500            # max distance between two reports (metres)
TIME_WINDOW_HOURS = 6     # max time gap between two reports (hours)
WEIGHTS = {"location": 0.4, "time": 0.2, "text": 0.4}
THRESHOLD = 0.6           # combined score needed to call it a duplicate

STOPWORDS = {
    "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "near",
    "is", "are", "was", "were", "be", "been", "has", "have", "had", "with",
    "by", "for", "from", "this", "that", "it", "its", "there", "some",
    "very", "just", "now", "area", "people",
}

# Words that mean the same thing for disaster reports (extend as needed)
SYNONYMS = {
    "blaze": "fire", "flames": "fire", "burning": "fire",
    "mudslide": "landslide", "landslip": "landslide",
    "inundated": "flood", "waterlogging": "flood", "waterlogged": "flood",
    "hurricane": "cyclone", "typhoon": "cyclone",
    "quake": "earthquake", "tremors": "earthquake", "tremor": "earthquake",
}


# ---------- Building blocks ----------

def haversine_m(lat1, lon1, lat2, lon2):
    """Distance in metres between two GPS points."""
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _stem(word):
    """Very light stemming so 'flooding' and 'flood' match."""
    for suffix in ("ing", "ed", "s"):
        if word.endswith(suffix) and not word.endswith("ss") and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)]
    return word


def keywords(text):
    """Lowercase, drop stopwords, map synonyms, stem. Returns a set of words."""
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    result = set()
    for w in words:
        if w in STOPWORDS:
            continue
        w = SYNONYMS.get(w, w)
        result.add(_stem(w))
    return result


def text_similarity(a, b):
    """0..1. Dice coefficient on keyword sets (2*shared / total)."""
    ka, kb = keywords(a), keywords(b)
    if not ka or not kb:
        return 0.0
    return 2 * len(ka & kb) / (len(ka) + len(kb))


# ---------- Comparing two reports ----------

def compare(new, old):
    """
    Compare a new report with an older one.
    Returns a dict with a score and a breakdown, or None if a hard gate fails.
    """
    # Gate 0: if both have a disaster type and they differ, not the same incident
    nt, ot = getattr(new, "disaster_type", None), getattr(old, "disaster_type", None)
    if nt and ot and nt.lower() != ot.lower():
        return None

    # Gate 1: location
    dist = haversine_m(new.latitude, new.longitude, old.latitude, old.longitude)
    if dist > RADIUS_M:
        return None

    # Gate 2: time
    gap = abs(new.timestamp - old.timestamp)
    if gap > timedelta(hours=TIME_WINDOW_HOURS):
        return None

    location_score = 1 - dist / RADIUS_M
    time_score = 1 - gap / timedelta(hours=TIME_WINDOW_HOURS)
    text_score = text_similarity(new.description, old.description)

    score = (
        WEIGHTS["location"] * location_score
        + WEIGHTS["time"] * time_score
        + WEIGHTS["text"] * text_score
    )
    return {
        "duplicate_of": old.id,
        "score": round(score, 3),
        "is_duplicate": score >= THRESHOLD,
        "breakdown": {
            "distance_m": round(dist, 1),
            "time_gap_minutes": round(gap.total_seconds() / 60, 1),
            "location_score": round(location_score, 3),
            "time_score": round(time_score, 3),
            "text_score": round(text_score, 3),
        },
    }


def find_duplicate(new, candidates):
    """
    Check one new report against earlier reports.
    Only reports at or before the new one's timestamp are considered,
    so the NEWER report is the one that gets flagged.
    Returns the best match (dict) if it passes the threshold, else None.
    """
    best = None
    for old in candidates:
        if old.id == new.id or old.timestamp > new.timestamp:
            continue
        result = compare(new, old)
        if result and result["is_duplicate"]:
            if best is None or result["score"] > best["score"]:
                best = result
    return best


# ---------- Database helpers ----------

def check_and_flag_duplicate(db, report, apply=True):
    """
    Call this right after a new report is saved.
    Looks for an earlier, non-duplicate report in the time window.
    If found and apply=True, sets report.is_duplicate = True.
    Returns the match dict (with 'duplicate_of' and 'breakdown') or None.
    """
    from models import Report

    earliest = report.timestamp - timedelta(hours=TIME_WINDOW_HOURS)
    candidates = (
        db.query(Report)
        .filter(
            Report.id != report.id,
            Report.is_duplicate == False,  # noqa: E712
            Report.timestamp >= earliest,
            Report.timestamp <= report.timestamp,
        )
        .all()
    )
    result = find_duplicate(report, candidates)
    if result and apply:
        report.is_duplicate = True
        db.commit()
    return result


def scan_all(db, apply=False):
    """
    Re-check every report in time order (useful for testing on seeded data).
    Ignores existing is_duplicate flags when deciding.
    With apply=True it only ever SETS flags to True, never clears them.
    Returns a list of match dicts, each with the 'report_id' that was flagged.
    """
    from models import Report

    reports = db.query(Report).order_by(Report.timestamp).all()
    originals, findings = [], []
    for r in reports:
        match = find_duplicate(r, originals)
        if match:
            match["report_id"] = r.id
            findings.append(match)
            if apply:
                r.is_duplicate = True
        else:
            originals.append(r)
    if apply:
        db.commit()
    return findings

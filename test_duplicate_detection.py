"""
Tests for duplicate_detection.py — no database or server needed.
Run with:  python test_duplicate_detection.py
"""

from datetime import datetime, timedelta
from types import SimpleNamespace

from duplicate_detection import compare, find_duplicate, text_similarity

NOW = datetime(2026, 9, 23, 12, 0, 0)


def make(id, desc, lat, lon, minutes_ago, disaster_type=None):
    return SimpleNamespace(
        id=id, description=desc, latitude=lat, longitude=lon,
        timestamp=NOW - timedelta(minutes=minutes_ago),
        disaster_type=disaster_type,
    )


# The original flood report from seed_test_data.py
original = make(1, "Severe flooding on MG Road, water entering ground-floor shops",
                18.5204, 73.8567, 60, "flood")


def test_seed_duplicate_pair_is_flagged():
    # Same flood, reported again ~25 metres away, 15 minutes later
    new = make(2, "Flood water rising near MG Road shops, people stranded",
               18.5206, 73.8569, 45, "flood")
    result = find_duplicate(new, [original])
    assert result is not None, "should be flagged as duplicate"
    assert result["duplicate_of"] == 1
    print("PASS  seed pair flagged:", result["score"], result["breakdown"])


def test_same_text_but_far_away_is_not_duplicate():
    new = make(3, "Severe flooding on MG Road, water entering shops",
               18.6000, 73.9000, 45, "flood")   # ~12 km away
    assert find_duplicate(new, [original]) is None
    print("PASS  far away -> not duplicate")


def test_same_place_but_days_apart_is_not_duplicate():
    old = make(4, "Severe flooding on MG Road, water entering shops",
               18.5204, 73.8567, 60 * 48)       # 2 days earlier
    new = make(5, "Severe flooding on MG Road, water entering shops",
               18.5205, 73.8568, 0)
    assert find_duplicate(new, [old]) is None
    print("PASS  days apart -> not duplicate")


def test_different_disaster_types_are_not_duplicates():
    fire = make(6, "Fire near MG Road shops, smoke everywhere",
                18.5205, 73.8568, 40, "fire")
    assert find_duplicate(fire, [original]) is None
    print("PASS  flood vs fire -> not duplicate")


def test_nearby_but_unrelated_text_is_not_duplicate():
    new = make(7, "Tree fell on parked car, driver unhurt",
               18.5206, 73.8569, 45)            # no disaster type given
    assert find_duplicate(new, [original]) is None
    print("PASS  nearby but unrelated -> not duplicate")


def test_older_report_is_never_flagged_against_newer_one():
    older = make(8, "Flood water rising near MG Road shops",
                 18.5206, 73.8569, 120)
    # 'original' is 60 min ago, newer than 'older', so it must be skipped
    assert find_duplicate(older, [original]) is None
    print("PASS  only earlier reports count as originals")


def test_synonyms_and_word_forms_match():
    assert text_similarity("flooding on the road", "road flood") > 0.5
    assert text_similarity("blaze at the market", "fire at market") > 0.5
    print("PASS  synonyms / word forms match")


if __name__ == "__main__":
    test_seed_duplicate_pair_is_flagged()
    test_same_text_but_far_away_is_not_duplicate()
    test_same_place_but_days_apart_is_not_duplicate()
    test_different_disaster_types_are_not_duplicates()
    test_nearby_but_unrelated_text_is_not_duplicate()
    test_older_report_is_never_flagged_against_newer_one()
    test_synonyms_and_word_forms_match()
    print("\nAll tests passed.")

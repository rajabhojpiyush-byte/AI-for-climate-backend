"""
Tests for ai/priority.py — Priority and queue score calculations.
Run with:  python test_priority.py
"""

from ai.priority import calculate_priority, calculate_priority_score


def test_standard_priority_mapping():
    assert calculate_priority("critical") == {"priority": "urgent", "score": 100.0}
    assert calculate_priority("high") == {"priority": "high", "score": 75.0}
    assert calculate_priority("medium") == {"priority": "normal", "score": 50.0}
    assert calculate_priority("moderate") == {"priority": "normal", "score": 50.0}
    assert calculate_priority("low") == {"priority": "low", "score": 25.0}
    print("PASS  standard priority scores match expected baseline")


def test_case_insensitivity_and_whitespace():
    assert calculate_priority("  CRITICAL  ")["score"] == 100.0
    assert calculate_priority("High")["score"] == 75.0
    assert calculate_priority("MEDIUM")["score"] == 50.0
    assert calculate_priority("LOW")["score"] == 25.0
    print("PASS  case-insensitivity and whitespace handled cleanly")


def test_unknown_and_empty_severity():
    assert calculate_priority("") == {"priority": "low", "score": 0.0}
    assert calculate_priority(None) == {"priority": "low", "score": 0.0}
    assert calculate_priority("catastrophic_alien_event") == {"priority": "low", "score": 0.0}
    print("PASS  empty and unknown severities return safe default")


def test_duplicate_penalty_in_scoring():
    normal_score = calculate_priority_score("High", confidence=85.0, is_duplicate=False)
    dup_score = calculate_priority_score("High", confidence=85.0, is_duplicate=True)
    assert dup_score < normal_score, f"Duplicate should have lower score: {dup_score} vs {normal_score}"
    assert dup_score >= 5.0, "Score should not drop below floor"
    print("PASS  duplicate reports are deprioritized in triage queue")


def test_confidence_and_image_adjustments():
    high_conf = calculate_priority_score("Critical", confidence=95.0, has_image=True)
    low_conf = calculate_priority_score("Critical", confidence=40.0, has_image=False)
    assert high_conf > low_conf, f"High confidence + image should score higher than low confidence: {high_conf} vs {low_conf}"
    assert high_conf <= 100.0
    print("PASS  confidence and image verification adjust queue priority")


if __name__ == "__main__":
    test_standard_priority_mapping()
    test_case_insensitivity_and_whitespace()
    test_unknown_and_empty_severity()
    test_duplicate_penalty_in_scoring()
    test_confidence_and_image_adjustments()
    print("\nAll priority tests passed successfully.")

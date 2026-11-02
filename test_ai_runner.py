"""
Tests for the scenarios + runner themselves. Run with:  python test_ai_runner.py
(Checks that the SCORING is right, using perfect, gullible and broken fake AIs.)
"""

import json

from ai_test_scenarios import SCENARIOS
from run_ai_tests import mock_call_ai, run_all

BY_TEXT = {s["description"]: s for s in SCENARIOS}


def oracle(description):
    """A perfect AI: right answer for genuine reports, unsure about false ones."""
    s = BY_TEXT[description]
    if s["group"] == "genuine":
        return json.dumps({"disaster_type": sorted(s["expected_type"])[0],
                           "severity": sorted(s["expected_severity"])[0],
                           "confidence": 90, "reasoning": "ok", "human_review_required": False})
    return json.dumps({"disaster_type": "other", "severity": "Low", "confidence": 10,
                       "reasoning": "not a real report"})


def gullible(description):
    """Believes everything: always flood / High / 95%."""
    return json.dumps({"disaster_type": "flood", "severity": "High", "confidence": 95,
                       "reasoning": "sure", "human_review_required": False})


def broken(description):
    raise TimeoutError("API down")


def test_scenarios_are_well_formed():
    ids = [s["id"] for s in SCENARIOS]
    assert len(ids) == len(set(ids))
    for s in SCENARIOS:
        assert s["group"] in ("genuine", "false")
        if s["group"] == "genuine":
            assert s["expected_type"] and s["expected_severity"]
    print(f"PASS  {len(SCENARIOS)} scenarios are well formed")


def test_perfect_ai_scores_100_percent():
    s = run_all(call_ai=oracle, delay_seconds=0, verbose=False)
    assert s["type_correct"] == s["genuine_total"] and s["severity_ok"] == s["genuine_total"]
    assert s["false_caught"] == s["false_total"] and s["failed_ids"] == []
    print("PASS  perfect AI -> everything passes")


def test_gullible_ai_is_exposed():
    s = run_all(call_ai=gullible, delay_seconds=0, verbose=False)
    assert s["false_caught"] == 0, "a gullible AI must NOT be credited for false reports"
    assert s["type_correct"] < s["genuine_total"]
    print("PASS  gullible AI -> false reports NOT caught, wrong types exposed")


def test_broken_ai_is_safe():
    s = run_all(call_ai=broken, delay_seconds=0, verbose=False)
    assert s["ai_failed"] == len(SCENARIOS)
    assert s["false_caught"] == s["false_total"]      # failures go to human review
    assert s["type_correct"] == 0
    print("PASS  broken AI -> no crash, everything routed to human review")


def test_mock_run_completes():
    s = run_all(call_ai=mock_call_ai, delay_seconds=0, verbose=False)
    assert s["genuine_total"] + s["false_total"] == len(SCENARIOS)
    print(f"PASS  mock run completes (type {s['type_correct']}/{s['genuine_total']}, "
          f"false caught {s['false_caught']}/{s['false_total']})")


if __name__ == "__main__":
    test_scenarios_are_well_formed()
    test_perfect_ai_scores_100_percent()
    test_gullible_ai_is_exposed()
    test_broken_ai_is_safe()
    test_mock_run_completes()
    print("\nAll tests passed.")

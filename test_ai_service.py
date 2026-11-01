"""
Tests for ai/ai_service.py — fake AI answers only, no internet, no API key.
Run from the project root with:  python test_ai_service.py
"""

import json
from types import SimpleNamespace

from ai_service import analyze_text_report, apply_to_report

REPORT = "Heavy rain has caused severe flooding and waterlogging in the area."


def fake(answer):
    return lambda description: answer


def boom(exc):
    def f(description):
        raise exc
    return f


def run(call, **kw):
    return analyze_text_report(REPORT, call_ai=call, delay_seconds=0, **kw)


# What Nugen's answers really look like (key names vary, casing varies)
NUGEN_STYLE = {
    "disaster_category": "Flood",
    "severity": "HIGH",
    "confidence": 0.9,
    "explanation": "Report describes heavy flooding and waterlogging.",
    "human_review_required": False,
}


def test_nugen_style_answer_is_cleaned():
    r = run(fake(json.dumps(NUGEN_STYLE)))
    assert r["ai_status"] == "Success"
    assert r["disaster_type"] == "flood"
    assert r["severity"] == "High"
    assert r["confidence"] == 90.0
    assert r["reasoning"].startswith("Report describes")
    assert r["human_review_required"] is False
    print("PASS  Nugen-style answer cleaned (flood / High / 90.0)")


def test_fenced_json():
    raw = "```json\n" + json.dumps(NUGEN_STYLE) + "\n```"
    assert run(fake(raw))["ai_status"] == "Success"
    print("PASS  ```json fenced answer works")


def test_ai_can_ask_for_human_review():
    r = run(fake(json.dumps({**NUGEN_STYLE, "human_review_required": True})))
    assert r["ai_status"] == "Success" and r["human_review_required"] is True
    assert "AI asked for human review" in r["review_reasons"]
    print("PASS  AI's own review request is respected")


def test_moderate_and_percent_and_loose_type():
    raw = json.dumps({**NUGEN_STYLE, "severity": "MODERATE", "confidence": "85%",
                      "disaster_category": "Flood / Water Inundation"})
    r = run(fake(raw))
    assert r["severity"] == "Medium" and r["confidence"] == 85.0 and r["disaster_type"] == "flood"
    print("PASS  MODERATE -> Medium, '85%' -> 85, 'Flood / Water Inundation' -> flood")


def test_other_loose_types():
    for label, expected in [("Wildfire", "fire"), ("Thunderstorm", "storm"),
                            ("Earthquake / Structural Damage", "earthquake"),
                            ("Landslide / Debris Flow", "landslide")]:
        r = run(fake(json.dumps({**NUGEN_STYLE, "disaster_category": label})))
        assert r["disaster_type"] == expected, (label, r["disaster_type"])
    print("PASS  loose type names mapped correctly")


def test_garbage_answer_falls_back_honestly():
    r = run(fake("sorry I cannot help"))
    assert r["ai_status"] == "Failed" and r["human_review_required"] is True
    assert r["severity"] is None and r["confidence"] is None      # nothing invented
    assert r["disaster_type"] == "flood"                           # keyword guess only
    assert "Manual review required" in r["reasoning"]
    print("PASS  garbage -> Failed, no invented severity/confidence, keyword guess, review")


def test_unrecognised_type_is_rejected():
    r = run(fake(json.dumps({**NUGEN_STYLE, "disaster_category": "alien invasion"})))
    assert r["ai_status"] == "Failed"
    print("PASS  nonsense type rejected")


def test_api_timeout_does_not_crash():
    r = run(boom(TimeoutError("timed out")))
    assert r["ai_status"] == "Failed" and r["human_review_required"] is True
    assert r["attempts"] == 2
    print("PASS  API timeout -> no crash, 2 attempts, review required")


def test_retry_recovers():
    calls = {"n": 0}

    def flaky(description):
        calls["n"] += 1
        if calls["n"] == 1:
            raise ConnectionError("blip")
        return json.dumps(NUGEN_STYLE)

    r = run(flaky)
    assert r["ai_status"] == "Success" and r["attempts"] == 2
    print("PASS  fails once, retry succeeds")


def test_no_keywords_and_ai_failed_gives_no_type():
    r = analyze_text_report("my cat is sleeping", call_ai=boom(OSError("down")), delay_seconds=0)
    assert r["disaster_type"] is None and r["human_review_required"] is True
    print("PASS  AI down + no keywords -> no type guess, review required")


def test_apply_to_report():
    report = SimpleNamespace()
    apply_to_report(report, run(fake(json.dumps(NUGEN_STYLE))))
    assert report.disaster_type == "flood" and report.severity == "High"
    assert report.confidence == 90.0 and report.human_review_required is False
    assert report.ai_reasoning.startswith("Report describes")
    print("PASS  apply_to_report fills the Report fields")


if __name__ == "__main__":
    test_nugen_style_answer_is_cleaned()
    test_fenced_json()
    test_ai_can_ask_for_human_review()
    test_moderate_and_percent_and_loose_type()
    test_other_loose_types()
    test_garbage_answer_falls_back_honestly()
    test_unrecognised_type_is_rejected()
    test_api_timeout_does_not_crash()
    test_retry_recovers()
    test_no_keywords_and_ai_failed_gives_no_type()
    test_apply_to_report()
    print("\nAll tests passed.")

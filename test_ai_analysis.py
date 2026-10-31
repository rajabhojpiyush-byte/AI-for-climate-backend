"""
Tests for ai_analysis.py — uses FAKE AI providers, so no API or internet needed.
Run with:  python test_ai_analysis.py
"""

import json

from ai_analysis import analyze

GOOD = {
    "disaster_type": "flood",
    "severity": "High",
    "confidence": 87.5,
    "reasoning": "Image shows waterlogged street matching the description.",
    "image_consistent": True,
}


def always(text):
    return lambda description, image: text


def always_raises(exc):
    def provider(description, image):
        raise exc
    return provider


def test_valid_response():
    r = analyze(always(json.dumps(GOOD)), "flooding on MG Road")
    assert r["ok"] and r["attempts"] == 1 and not r["needs_human_review"]
    assert r["analysis"]["disaster_type"] == "flood"
    print("PASS  valid response accepted")


def test_json_inside_code_fence_and_extra_text():
    raw = "Sure! Here is the analysis:\n```json\n" + json.dumps(GOOD) + "\n```\nHope that helps."
    r = analyze(always(raw), "x")
    assert r["ok"] and r["attempts"] == 1
    print("PASS  JSON hidden in code fence / extra text is extracted")


def test_case_is_normalised():
    raw = json.dumps({**GOOD, "severity": "HIGH", "disaster_type": "FLOOD"})
    r = analyze(always(raw), "x")
    assert r["analysis"]["severity"] == "High" and r["analysis"]["disaster_type"] == "flood"
    print("PASS  'HIGH' / 'FLOOD' normalised")


def test_invalid_json_falls_back():
    r = analyze(always("this is not json at all"), "x", max_attempts=3)
    assert not r["ok"] and r["needs_human_review"] and r["attempts"] == 3
    assert len(r["errors"]) == 3
    print("PASS  invalid JSON -> retried 3x, then human-review fallback")


def test_incomplete_response_rejected():
    bad = {k: v for k, v in GOOD.items() if k != "severity"}
    r = analyze(always(json.dumps(bad)), "x", max_attempts=2)
    assert not r["ok"] and r["needs_human_review"]
    assert "severity" in r["errors"][0]
    print("PASS  missing field rejected, error names the field")


def test_bad_values_rejected():
    for bad in (
        {**GOOD, "confidence": 140},          # out of range
        {**GOOD, "severity": "Apocalyptic"},  # unknown severity
        {**GOOD, "disaster_type": "alien"},   # unknown type
        {**GOOD, "reasoning": ""},            # empty reasoning
    ):
        r = analyze(always(json.dumps(bad)), "x", max_attempts=1)
        assert not r["ok"] and r["needs_human_review"], bad
    print("PASS  out-of-range / unknown / empty values rejected")


def test_api_failure_does_not_crash():
    r = analyze(always_raises(TimeoutError("API timed out")), "x", max_attempts=3)
    assert not r["ok"] and r["needs_human_review"] and r["attempts"] == 3
    assert "TimeoutError" in r["errors"][0]
    print("PASS  API timeout -> no crash, human-review fallback")


def test_retry_recovers_from_flaky_api():
    calls = {"n": 0}

    def flaky(description, image):
        calls["n"] += 1
        if calls["n"] == 1:
            raise ConnectionError("network blip")
        return json.dumps(GOOD)

    r = analyze(flaky, "x", max_attempts=3)
    assert r["ok"] and r["attempts"] == 2 and len(r["errors"]) == 1
    print("PASS  fails once, retry succeeds (attempts = 2)")


def test_low_confidence_goes_to_human():
    r = analyze(always(json.dumps({**GOOD, "confidence": 30})), "x")
    assert r["ok"] and r["needs_human_review"]
    assert "low confidence" in r["review_reasons"][0]
    print("PASS  low confidence -> flagged for human review")


def test_image_mismatch_goes_to_human():
    r = analyze(always(json.dumps({**GOOD, "image_consistent": False})), "x")
    assert r["ok"] and r["needs_human_review"]
    assert "image" in r["review_reasons"][0]
    print("PASS  image/text mismatch -> flagged for human review")


if __name__ == "__main__":
    test_valid_response()
    test_json_inside_code_fence_and_extra_text()
    test_case_is_normalised()
    test_invalid_json_falls_back()
    test_incomplete_response_rejected()
    test_bad_values_rejected()
    test_api_failure_does_not_crash()
    test_retry_recovers_from_flaky_api()
    test_low_confidence_goes_to_human()
    test_image_mismatch_goes_to_human()
    print("\nAll tests passed.")

"""
Tests for ai/severity.py — Rule-based severity calculation.
Run with:  python test_severity.py
"""

from ai.severity import calculate_severity


def test_critical_scenarios():
    reports = [
        "Multiple families are trapped inside a collapsed apartment building.",
        "Flash flood has caused 3 deaths and people are drowning in the river.",
        "Massive explosion in chemical factory, critical casualties reported.",
    ]
    for r in reports:
        res = calculate_severity(r)
        assert res["severity"] == "critical", f"Expected critical for '{r}', got {res}"
    print("PASS  critical disaster scenarios correctly identified")


def test_high_scenarios():
    reports = [
        "Heavy rain has flooded the main market, roads submerged and families stranded.",
        "Warehouse fire is raging out of control, several workers hospitalized.",
        "Landslide destroyed two houses on the hillside road.",
    ]
    for r in reports:
        res = calculate_severity(r)
        assert res["severity"] == "high", f"Expected high for '{r}', got {res}"
    print("PASS  high disaster scenarios correctly identified")


def test_medium_scenarios():
    reports = [
        "Knee-deep waterlogging on 5th avenue, traffic halted and power outage in sector 2.",
        "Tree branch fell on road causing blockage and minor damage to parked vehicle.",
        "River overflowing slightly near embankment, road closed as precaution.",
    ]
    for r in reports:
        res = calculate_severity(r)
        assert res["severity"] == "medium", f"Expected medium for '{r}', got {res}"
    print("PASS  medium disaster scenarios correctly identified")


def test_low_scenarios():
    reports = [
        "Light drizzle in the morning, a few small puddles on the walkway, all safe.",
        "Water has completely receded from the street, municipal team confirmed situation under control.",
        "Small roadside trash fire was contained quickly with no damage.",
    ]
    for r in reports:
        res = calculate_severity(r)
        assert res["severity"] == "low", f"Expected low for '{r}', got {res}"
    print("PASS  low disaster scenarios correctly identified")


def test_escalation_on_life_threat():
    # Contains a low/medium keyword ('minor', 'delay'), but also 'trapped' -> must escalate to critical
    report = "Minor delay on highway because people are trapped under collapsed bridge structure."
    res = calculate_severity(report)
    assert res["severity"] == "critical", f"Expected escalation to critical, got {res}"
    print("PASS  life-threat escalation overrules mild words")


def test_word_boundary_safety():
    # Words like 'deadline' shouldn't trigger 'dead', 'leadership' shouldn't trigger 'leader'
    report = "Project deadline was today, normal meeting held without any incident."
    res = calculate_severity(report)
    assert res["severity"] != "critical", f"Substring false match occurred: {res}"
    print("PASS  word boundaries prevent false substring matches")


def test_empty_input_handled_safely():
    res1 = calculate_severity("")
    res2 = calculate_severity("   ")
    assert res1["severity"] == "low" and res1["confidence"] == 0.0
    assert res2["severity"] == "low" and res2["confidence"] == 0.0
    print("PASS  empty string handled gracefully")


if __name__ == "__main__":
    test_critical_scenarios()
    test_high_scenarios()
    test_medium_scenarios()
    test_low_scenarios()
    test_escalation_on_life_threat()
    test_word_boundary_safety()
    test_empty_input_handled_safely()
    print("\nAll severity tests passed successfully.")

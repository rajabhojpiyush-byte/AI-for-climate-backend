"""
ResQAI — AI test runner (tasks 6, 7 and 10, text reports)

Runs every scenario in ai_test_scenarios.py through ai_service.analyze_text_report
and prints how well the AI did.

  python run_ai_tests.py --mock       practice run with a FAKE keyword "AI" (no key, no internet)
  python run_ai_tests.py              REAL run through your Nugen model (needs the .env file)
  python run_ai_tests.py --limit 5    only the first 5 scenarios (saves credits)

Scoring:
  genuine reports -> right disaster type AND an acceptable severity
  false reports   -> flagged for human review (a report the system trusts blindly = FAIL)
"""

import argparse
import json

from ai_service import analyze_text_report
from ai_test_scenarios import SCENARIOS


def evaluate(scn, result):
    """Score one scenario. Returns a dict with 'passed' and a short 'detail'."""
    if scn["group"] == "genuine":
        ok = result["ai_status"] == "Success"
        type_ok = ok and result["disaster_type"] in scn["expected_type"]
        sev_ok = ok and result["severity"] in scn["expected_severity"]
        detail = (f"type={result['disaster_type']} severity={result['severity']} "
                  f"confidence={result['confidence']}")
        if not ok:
            detail = "AI failed: " + (result["errors"][-1] if result["errors"] else "unknown")
        return {"passed": type_ok and sev_ok, "type_ok": type_ok, "severity_ok": sev_ok,
                "detail": detail}
    caught = bool(result["human_review_required"])
    detail = (f"flagged for review ({'; '.join(result['review_reasons']) or 'yes'})" if caught
              else f"TRUSTED: type={result['disaster_type']} severity={result['severity']} "
                   f"confidence={result['confidence']}")
    return {"passed": caught, "caught": caught, "detail": detail}


def summarise(rows):
    genuine = [(s, r, e) for s, r, e in rows if s["group"] == "genuine"]
    false = [(s, r, e) for s, r, e in rows if s["group"] == "false"]
    return {
        "genuine_total": len(genuine),
        "type_correct": sum(e["type_ok"] for _, _, e in genuine),
        "severity_ok": sum(e["severity_ok"] for _, _, e in genuine),
        "ai_failed": sum(r["ai_status"] == "Failed" for _, r, _ in rows),
        "genuine_sent_to_review": sum(r["human_review_required"] for _, r, _ in genuine),
        "false_total": len(false),
        "false_caught": sum(e["caught"] for _, _, e in false),
        "failed_ids": [s["id"] for s, _, e in rows if not e["passed"]],
    }


def run_all(call_ai=None, limit=None, delay_seconds=1, verbose=True):
    scenarios = SCENARIOS[:limit] if limit else SCENARIOS
    rows = []
    for scn in scenarios:
        result = analyze_text_report(scn["description"], call_ai=call_ai,
                                     delay_seconds=delay_seconds)
        ev = evaluate(scn, result)
        rows.append((scn, result, ev))
        if verbose:
            print(f"{'PASS' if ev['passed'] else 'FAIL'}  {scn['id']}  {ev['detail']}")
    summary = summarise(rows)
    if verbose:
        print_summary(summary, rows)
    return summary


def print_summary(s, rows):
    print("\n----- SUMMARY -----")
    if s["genuine_total"]:
        print(f"Genuine reports : type correct {s['type_correct']}/{s['genuine_total']}, "
              f"severity acceptable {s['severity_ok']}/{s['genuine_total']}")
        print(f"                  sent to human review anyway: {s['genuine_sent_to_review']}")
    if s["false_total"]:
        print(f"False reports   : caught (sent to review) {s['false_caught']}/{s['false_total']}")
    print(f"AI call failures: {s['ai_failed']}/{len(rows)}")
    if s["failed_ids"]:
        print("Failed scenarios:", ", ".join(s["failed_ids"]))
    if rows and s["ai_failed"] == len(rows):
        first = rows[0][1]["errors"][:1]
        print("\nEvery AI call failed. Check the Nugen key in .env and your internet.")
        print("First error:", first[0] if first else "unknown")


# ---------- a FAKE keyword "AI" for practice runs (not a real model) ----------

def mock_call_ai(description):
    t = description.lower()
    rules = [("earthquake", ("earthquake", "tremor", "shaking")),
             ("landslide", ("landslide", "mud", "rocks")),
             ("flood", ("flood", "submerged")),
             ("fire", ("fire", "smoke")),
             ("cyclone", ("cyclone",)),
             ("heatwave", ("heatwave", "degrees"))]
    kind = next((k for k, words in rules if any(w in t for w in words)), None)
    if kind is None:
        return json.dumps({"disaster_type": "other", "severity": "Low", "confidence": 15,
                           "reasoning": "No disaster keywords found."})
    if any(w in t for w in ("rooftops", "dead", "trapped")):
        sev = "Critical"
    elif any(w in t for w in ("urgent", "stuck", "fainted", "evacuat", "roofs", "cracks")):
        sev = "High"
    elif any(w in t for w in ("small", "little", "light", "few", "hot day", "no damage")):
        sev = "Low"
    else:
        sev = "Medium"
    return json.dumps({"disaster_type": kind, "severity": sev, "confidence": 80,
                       "reasoning": f"Keywords suggest {kind}."})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mock", action="store_true", help="use the fake keyword AI")
    parser.add_argument("--limit", type=int, default=None, help="run only the first N scenarios")
    args = parser.parse_args()
    if args.mock:
        print("*** MOCK RUN: a fake keyword AI, NOT real model results ***\n")
    run_all(call_ai=mock_call_ai if args.mock else None, limit=args.limit,
            delay_seconds=0 if args.mock else 1)

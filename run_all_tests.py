"""
ResQAI — Master Offline Test Suite Runner

Runs all self-contained tests across validation, safe client,
duplicate detection, severity heuristics, priority calculations,
2G/3G low-bandwidth optimizations, offline batch sync, and the 19 AI test scenarios.

No API keys or network connection required.
Run with:  python run_all_tests.py
"""

import sys
import subprocess


TEST_MODULES = [
    ("Duplicate Detection", "test_duplicate_detection.py"),
    ("AI Response Validation & Retries", "test_ai_analysis.py"),
    ("Safe AI Service Integration", "test_ai_service.py"),
    ("Disaster Severity Rules", "test_severity.py"),
    ("Priority Scoring & Queueing", "test_priority.py"),
    ("2G/3G Low-Bandwidth & WAL Concurrency", "test_low_bandwidth.py"),
    ("Offline Batch Sync Pipeline", "test_batch_sync.py"),
]


def run_unit_tests():
    print("=" * 60)
    print("RESQAI BACKEND — RUNNING OFFLINE TEST SUITE")
    print("=" * 60)

    all_passed = True

    for title, script in TEST_MODULES:
        print(f"\n>>> Running {title} ({script})...")
        proc = subprocess.run([sys.executable, script], capture_output=True, text=True)
        if proc.returncode == 0:
            print(proc.stdout.strip())
            print(f"[OK] {title} PASSED")
        else:
            print(f"[FAIL] {title} FAILED:")
            if proc.stdout:
                print(proc.stdout)
            if proc.stderr:
                print(proc.stderr)
            all_passed = False

    print("\n" + "=" * 60)
    print(">>> Running AI Test Scenarios (Mock AI Keyword Mode)...")
    proc = subprocess.run([sys.executable, "run_ai_tests.py", "--mock"], capture_output=True, text=True)
    if proc.returncode == 0:
        print(proc.stdout.strip())
        print("[OK] AI Test Scenarios PASSED")
    else:
        print("[FAIL] AI Test Scenarios FAILED:")
        if proc.stdout:
            print(proc.stdout)
        if proc.stderr:
            print(proc.stderr)
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("ALL TESTS PASSED! Backend is verified and ready for review.")
    else:
        print("SOME TESTS FAILED. Please review the output above.")
    print("=" * 60)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(run_unit_tests())

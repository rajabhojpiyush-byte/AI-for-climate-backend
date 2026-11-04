"""
Tests for Offline Batch Sync (POST /reports/sync-batch)
Run with:  python test_batch_sync.py
"""

from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_empty_batch_sync():
    """Verify that empty batch returns 0 synced count without errors."""
    payload = {"reports": []}
    res = client.post("/reports/sync-batch", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["synced_count"] == 0
    assert data["duplicates_count"] == 0
    print("PASS  empty batch handled gracefully")


def test_multiple_offline_reports_synced_together():
    """Verify that multiple reports submitted in 1 request are processed and deduplicated."""
    now = datetime.utcnow()
    
    payload = {
        "reports": [
            {
                "client_id": "phone-queue-101",
                "description": "Severe flooding on Karve Road, water entered 4 shops",
                "latitude": 18.5074,
                "longitude": 73.8077,
                "timestamp": (now - timedelta(minutes=30)).isoformat(),
            },
            {
                "client_id": "phone-queue-102",
                "description": "Rising flood water near Karve Road shops, traffic stranded",
                "latitude": 18.5076,
                "longitude": 73.8079,
                "timestamp": (now - timedelta(minutes=10)).isoformat(),
            },
        ]
    }

    res = client.post("/reports/sync-batch", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["synced_count"] == 2
    results = data["results"]
    assert len(results) == 2

    # Check client_id mapping is preserved for mobile offline storage sync
    assert results[0]["client_id"] == "phone-queue-101"
    assert results[1]["client_id"] == "phone-queue-102"

    # Both must receive valid database IDs
    assert results[0]["report_id"] is not None
    assert results[1]["report_id"] is not None

    # The second report was ~25m away and 20 mins later about the same flood -> must be detected as duplicate!
    assert results[1]["is_duplicate"] is True
    assert data["duplicates_count"] >= 1
    print(f"PASS  batch sync processed {data['synced_count']} reports and detected {data['duplicates_count']} duplicate(s)")


if __name__ == "__main__":
    test_empty_batch_sync()
    test_multiple_offline_reports_synced_together()
    print("\nAll offline batch sync tests passed successfully!")

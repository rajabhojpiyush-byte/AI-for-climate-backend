"""
Tests for Offline Batch Sync (POST /reports/sync-batch)
Pure Python async tests — no external testclient required.
Run with:  python test_batch_sync.py
"""

import asyncio
from datetime import datetime, timedelta
from database import SessionLocal
from schemas import BatchSyncRequest, OfflineReportItem
from main import sync_offline_reports


def test_empty_batch_sync():
    """Verify that empty batch returns 0 synced count without errors."""
    db = SessionLocal()
    try:
        batch = BatchSyncRequest(reports=[])
        data = asyncio.run(sync_offline_reports(batch, db))
        assert data["synced_count"] == 0
        assert data["duplicates_count"] == 0
        print("PASS  empty batch handled gracefully")
    finally:
        db.close()


def test_multiple_offline_reports_synced_together():
    """Verify that multiple reports submitted in 1 request are processed and deduplicated."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        batch = BatchSyncRequest(
            reports=[
                OfflineReportItem(
                    client_id="phone-queue-101",
                    description="Severe flooding on Karve Road, water entered 4 shops",
                    latitude=18.5074,
                    longitude=73.8077,
                    timestamp=now - timedelta(minutes=30),
                ),
                OfflineReportItem(
                    client_id="phone-queue-102",
                    description="Rising flood water near Karve Road shops, traffic stranded",
                    latitude=18.5076,
                    longitude=73.8079,
                    timestamp=now - timedelta(minutes=10),
                ),
            ]
        )
        data = asyncio.run(sync_offline_reports(batch, db))

        assert data["synced_count"] == 2
        results = data["results"]
        assert len(results) == 2

        # Check client_id mapping is preserved for mobile offline storage sync
        assert results[0]["client_id"] == "phone-queue-101"
        assert results[1]["client_id"] == "phone-queue-102"

        # Both must receive valid database IDs
        assert results[0]["report_id"] is not None
        assert results[1]["report_id"] is not None

        # The second report is a duplicate of the first
        assert results[1]["is_duplicate"] is True
        assert data["duplicates_count"] >= 1
        print(f"PASS  batch sync processed {data['synced_count']} reports and detected {data['duplicates_count']} duplicate(s)")
    finally:
        db.close()


if __name__ == "__main__":
    test_empty_batch_sync()
    test_multiple_offline_reports_synced_together()
    print("\nAll offline batch sync tests passed successfully!")

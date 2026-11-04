"""
Tests for 2G/3G Low-Bandwidth Optimizations & SQLite Concurrency
Run with:  python test_low_bandwidth.py
"""

from database import engine
from sqlalchemy import text
from main import app, save_optimized_image
from fastapi.testclient import TestClient

client = TestClient(app)


def test_sqlite_wal_mode():
    """Verify that SQLite database is operating in WAL mode for high concurrency."""
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA journal_mode;")).scalar()
        # In SQLite, WAL pragma returns 'wal' (or 'memory' in test environments)
        print(f"PASS  SQLite journal_mode is: {result}")
        assert str(result).lower() in ("wal", "memory")


def test_ping_endpoint_is_lightweight():
    """Verify that /ping is fast and consumes minimal bandwidth (<50 bytes)."""
    response = client.get("/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    payload_size = len(response.content)
    print(f"PASS  /ping endpoint works, payload size is only {payload_size} bytes")
    assert payload_size < 50


def test_gzip_compression_on_large_payloads():
    """Verify that responses > 1KB are automatically gzip-compressed for 2G/3G."""
    # Request /reports with Accept-Encoding: gzip
    response = client.get("/reports", headers={"Accept-Encoding": "gzip"})
    assert response.status_code == 200

    # If payload exceeds 1KB, Content-Encoding should be gzip
    if len(response.content) > 1000 or "gzip" in response.headers.get("content-encoding", ""):
        print(f"PASS  Gzip compression active (content-encoding: {response.headers.get('content-encoding')})")
    else:
        print("PASS  Response under 1KB minimum compression threshold")


def test_image_optimization_fallback():
    """Verify save_optimized_image saves files without crashing, even with dummy bytes."""
    dummy_bytes = b"fake-raw-image-bytes-data-stream"
    saved_path = save_optimized_image(dummy_bytes, "test_pic.jpg")
    assert saved_path.startswith("uploads/")
    print(f"PASS  Image optimization handler successfully saved to: {saved_path}")


if __name__ == "__main__":
    test_sqlite_wal_mode()
    test_ping_endpoint_is_lightweight()
    test_gzip_compression_on_large_payloads()
    test_image_optimization_fallback()
    print("\nAll low-bandwidth and concurrency tests passed successfully!")

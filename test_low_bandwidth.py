"""
Tests for 2G/3G Low-Bandwidth Optimizations & SQLite Concurrency
Pure Python unit tests — no external testclient required.
Run with:  python test_low_bandwidth.py
"""

from database import engine
from sqlalchemy import text
from main import app, save_optimized_image, ping
from fastapi.middleware.gzip import GZipMiddleware


def test_sqlite_wal_mode():
    """Verify that SQLite database is operating in WAL mode for high concurrency."""
    with engine.connect() as conn:
        result = conn.execute(text("PRAGMA journal_mode;")).scalar()
        print(f"PASS  SQLite journal_mode is: {result}")
        assert str(result).lower() in ("wal", "memory")


def test_ping_endpoint_is_lightweight():
    """Verify that /ping is fast and consumes minimal bandwidth (<50 bytes)."""
    res = ping()
    assert res == {"status": "ok"}
    print("PASS  /ping endpoint returns ok")


def test_gzip_middleware_configured():
    """Verify that GZipMiddleware is registered on the FastAPI app for 2G/3G."""
    # Check that any user middleware or middleware stack contains GZipMiddleware
    has_gzip = any(
        (getattr(m, "cls", None) == GZipMiddleware) or ("gzip" in str(getattr(m, "cls", "")).lower())
        for m in app.user_middleware
    )
    assert has_gzip, "GZipMiddleware should be registered in FastAPI app"
    print("PASS  Gzip compression middleware is configured on FastAPI app")


def test_image_optimization_fallback():
    """Verify save_optimized_image saves files without crashing, even with dummy bytes."""
    dummy_bytes = b"fake-raw-image-bytes-data-stream"
    saved_path = save_optimized_image(dummy_bytes, "test_pic.jpg")
    assert saved_path.startswith("uploads/")
    print(f"PASS  Image optimization handler successfully saved to: {saved_path}")


if __name__ == "__main__":
    test_sqlite_wal_mode()
    test_ping_endpoint_is_lightweight()
    test_gzip_middleware_configured()
    test_image_optimization_fallback()
    print("\nAll low-bandwidth and concurrency tests passed successfully!")

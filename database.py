from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./disaster.db"

# connect_args:
# - check_same_thread: False allows multi-threaded requests in FastAPI
# - timeout: 30 ensures queries wait up to 30s instead of throwing 'database is locked'
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30}
)


# SQLite optimizations for high concurrency during disasters:
# WAL (Write-Ahead Logging) enables simultaneous readers and writers.
# synchronous=NORMAL improves disk write speed while maintaining crash resistance.
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

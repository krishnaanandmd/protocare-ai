import logging
import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

log = logging.getLogger("database")

# Store the SQLite database alongside the backend code.
# In production, switch to PostgreSQL via DATABASE_URL env var.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./question_log.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    # Validate connections before handing them to callers; auto-recovers
    # when a previously-unreachable database (e.g. Railway private DNS)
    # becomes available without requiring an app restart.
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


_INIT_RETRIES = int(os.getenv("DB_INIT_RETRIES", "3"))
_INIT_BACKOFF = float(os.getenv("DB_INIT_BACKOFF_SECS", "2"))


def init_db():
    """Create all tables. Call once at startup.

    Retries a few times with exponential back-off so that transient DNS
    delays (common with Railway private networking) don't cause the
    startup health-check to report a degraded database.

    Non-fatal: if the database is still unreachable after retries, log a
    warning and let the app start anyway.  Core functionality (RAG,
    uploads, doctors) does not need PostgreSQL.
    """
    for attempt in range(1, _INIT_RETRIES + 1):
        try:
            Base.metadata.create_all(bind=engine)
            log.info("Database initialised (attempt %d/%d)", attempt, _INIT_RETRIES)
            return
        except Exception as e:
            if attempt < _INIT_RETRIES:
                wait = _INIT_BACKOFF * (2 ** (attempt - 1))
                log.info(
                    "Database not yet reachable (attempt %d/%d), retrying in %.1fs: %s",
                    attempt, _INIT_RETRIES, wait, e,
                )
                time.sleep(wait)
            else:
                log.warning(
                    "Database unavailable at startup after %d attempts "
                    "— question logging will be degraded: %s",
                    _INIT_RETRIES, e,
                )

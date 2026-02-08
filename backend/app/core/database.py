import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

log = logging.getLogger("database")

# Store the SQLite database alongside the backend code.
# In production, switch to PostgreSQL via DATABASE_URL env var.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./question_log.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
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


def init_db():
    """Create all tables. Call once at startup.

    Non-fatal: if the database is unreachable (e.g. Railway internal DNS
    not yet available), log a warning and let the app start anyway.
    Core functionality (RAG, uploads, doctors) does not need PostgreSQL.
    """
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        log.warning("Database unavailable at startup — question logging will be degraded: %s", e)

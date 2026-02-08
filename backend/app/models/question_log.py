import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean
from app.core.database import Base


class QuestionLog(Base):
    """Tracks every patient/provider question submitted through the portal."""

    __tablename__ = "question_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Who asked
    actor = Column(String, nullable=False, index=True)  # PATIENT | PROVIDER
    session_id = Column(String, nullable=True, index=True)  # browser session grouping

    # What they asked
    question = Column(Text, nullable=False)
    body_part = Column(String, nullable=True, index=True)

    # Which provider / model they asked it to
    doctor_id = Column(String, nullable=True, index=True)
    doctor_name = Column(String, nullable=True)

    # Response metadata
    answer_snippet = Column(Text, nullable=True)  # first ~500 chars of answer
    citations_count = Column(Integer, default=0)
    latency_ms = Column(Integer, nullable=True)
    had_follow_up = Column(Boolean, default=False)
    follow_up_question = Column(Text, nullable=True)

    # Whether the guardrail was triggered (emergency query blocked)
    guardrail_triggered = Column(Boolean, default=False)

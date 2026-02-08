"""Service for logging and querying patient/provider questions."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.models.question_log import QuestionLog


def log_question(
    db: Session,
    *,
    actor: str,
    question: str,
    doctor_id: Optional[str] = None,
    doctor_name: Optional[str] = None,
    body_part: Optional[str] = None,
    session_id: Optional[str] = None,
    answer_snippet: Optional[str] = None,
    citations_count: int = 0,
    latency_ms: Optional[int] = None,
    had_follow_up: bool = False,
    follow_up_question: Optional[str] = None,
    guardrail_triggered: bool = False,
) -> QuestionLog:
    """Persist a question record. Called after each /rag/query response."""
    entry = QuestionLog(
        actor=actor,
        question=question,
        doctor_id=doctor_id,
        doctor_name=doctor_name,
        body_part=body_part,
        session_id=session_id,
        answer_snippet=answer_snippet[:500] if answer_snippet else None,
        citations_count=citations_count,
        latency_ms=latency_ms,
        had_follow_up=had_follow_up,
        follow_up_question=follow_up_question,
        guardrail_triggered=guardrail_triggered,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    logger.info(
        "question_logged",
        question_id=entry.id,
        actor=actor,
        doctor_id=doctor_id,
        body_part=body_part,
    )
    return entry


def list_questions(
    db: Session,
    *,
    doctor_id: Optional[str] = None,
    body_part: Optional[str] = None,
    actor: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[QuestionLog], int]:
    """Return filtered question logs with total count."""
    query = db.query(QuestionLog)

    if doctor_id:
        query = query.filter(QuestionLog.doctor_id == doctor_id)
    if body_part:
        query = query.filter(QuestionLog.body_part == body_part)
    if actor:
        query = query.filter(QuestionLog.actor == actor)
    if since:
        query = query.filter(QuestionLog.created_at >= since)
    if until:
        query = query.filter(QuestionLog.created_at <= until)

    total = query.count()
    rows = query.order_by(QuestionLog.created_at.desc()).offset(offset).limit(limit).all()
    return rows, total


def get_analytics(
    db: Session,
    *,
    doctor_id: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
) -> dict:
    """Aggregate analytics for provider feedback and research."""
    base = db.query(QuestionLog)
    if doctor_id:
        base = base.filter(QuestionLog.doctor_id == doctor_id)
    if since:
        base = base.filter(QuestionLog.created_at >= since)
    if until:
        base = base.filter(QuestionLog.created_at <= until)

    total = base.count()
    if total == 0:
        return {"total_questions": 0}

    # Questions per provider
    questions_by_doctor = (
        base.with_entities(
            QuestionLog.doctor_id,
            QuestionLog.doctor_name,
            func.count().label("count"),
        )
        .filter(QuestionLog.doctor_id.isnot(None))
        .group_by(QuestionLog.doctor_id, QuestionLog.doctor_name)
        .order_by(func.count().desc())
        .all()
    )

    # Questions per body part (CareGuide path)
    questions_by_body_part = (
        base.with_entities(
            QuestionLog.body_part,
            func.count().label("count"),
        )
        .filter(QuestionLog.body_part.isnot(None))
        .group_by(QuestionLog.body_part)
        .order_by(func.count().desc())
        .all()
    )

    # Actor breakdown
    questions_by_actor = (
        base.with_entities(
            QuestionLog.actor,
            func.count().label("count"),
        )
        .group_by(QuestionLog.actor)
        .all()
    )

    # Average latency
    avg_latency = (
        base.with_entities(func.avg(QuestionLog.latency_ms))
        .filter(QuestionLog.latency_ms.isnot(None))
        .scalar()
    )

    # Guardrail trigger rate
    guardrail_count = base.filter(QuestionLog.guardrail_triggered.is_(True)).count()

    return {
        "total_questions": total,
        "questions_by_doctor": [
            {"doctor_id": row.doctor_id, "doctor_name": row.doctor_name, "count": row.count}
            for row in questions_by_doctor
        ],
        "questions_by_body_part": [
            {"body_part": row.body_part, "count": row.count}
            for row in questions_by_body_part
        ],
        "questions_by_actor": [
            {"actor": row.actor, "count": row.count}
            for row in questions_by_actor
        ],
        "avg_latency_ms": round(avg_latency) if avg_latency else None,
        "guardrail_triggers": guardrail_count,
    }

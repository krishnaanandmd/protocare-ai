"""Service for logging and querying patient/provider questions."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, case
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


def get_weekly_report(
    db: Session,
    *,
    week_of: Optional[datetime] = None,
) -> dict:
    """Generate a weekly summary report.

    If week_of is None, defaults to the most recent completed week
    (Monday 00:00 UTC to Sunday 23:59 UTC).
    """
    if week_of is None:
        now = datetime.now(timezone.utc)
        # Most recent Monday at midnight
        days_since_monday = now.weekday()
        end = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        start = end - timedelta(days=7)
    else:
        # Start from the Monday of the given week
        days_since_monday = week_of.weekday()
        start = (week_of - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = start + timedelta(days=7)

    base = db.query(QuestionLog).filter(
        QuestionLog.created_at >= start,
        QuestionLog.created_at < end,
    )

    total = base.count()

    # Per-doctor breakdown with patient vs provider split
    doctor_rows = (
        base.with_entities(
            QuestionLog.doctor_id,
            QuestionLog.doctor_name,
            func.count().label("total"),
            func.sum(case((QuestionLog.actor == "PATIENT", 1), else_=0)).label("patient_count"),
            func.sum(case((QuestionLog.actor == "PROVIDER", 1), else_=0)).label("provider_count"),
            func.avg(QuestionLog.latency_ms).label("avg_latency"),
        )
        .filter(QuestionLog.doctor_id.isnot(None))
        .group_by(QuestionLog.doctor_id, QuestionLog.doctor_name)
        .order_by(func.count().desc())
        .all()
    )

    # Per body-part breakdown (CareGuide MSK usage)
    body_part_rows = (
        base.with_entities(
            QuestionLog.body_part,
            func.count().label("total"),
        )
        .filter(QuestionLog.body_part.isnot(None))
        .group_by(QuestionLog.body_part)
        .order_by(func.count().desc())
        .all()
    )

    # Unique sessions (proxy for unique users)
    unique_sessions = (
        base.with_entities(func.count(func.distinct(QuestionLog.session_id)))
        .filter(QuestionLog.session_id.isnot(None))
        .scalar()
    ) or 0

    # Top 10 most-asked questions (exact duplicates)
    top_questions = (
        base.with_entities(
            QuestionLog.question,
            QuestionLog.doctor_name,
            QuestionLog.body_part,
            func.count().label("times_asked"),
        )
        .group_by(QuestionLog.question, QuestionLog.doctor_name, QuestionLog.body_part)
        .order_by(func.count().desc())
        .limit(10)
        .all()
    )

    # Guardrail triggers
    guardrail_count = base.filter(QuestionLog.guardrail_triggered.is_(True)).count()

    # Avg latency overall
    avg_latency = (
        base.with_entities(func.avg(QuestionLog.latency_ms))
        .filter(QuestionLog.latency_ms.isnot(None))
        .scalar()
    )

    # Previous week for comparison
    prev_start = start - timedelta(days=7)
    prev_total = (
        db.query(func.count(QuestionLog.id))
        .filter(
            QuestionLog.created_at >= prev_start,
            QuestionLog.created_at < start,
        )
        .scalar()
    ) or 0

    return {
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat(),
        },
        "summary": {
            "total_questions": total,
            "previous_week_total": prev_total,
            "week_over_week_change": total - prev_total,
            "unique_sessions": unique_sessions,
            "avg_latency_ms": round(avg_latency) if avg_latency else None,
            "guardrail_triggers": guardrail_count,
        },
        "by_doctor": [
            {
                "doctor_id": r.doctor_id,
                "doctor_name": r.doctor_name,
                "total": r.total,
                "from_patients": r.patient_count,
                "from_providers": r.provider_count,
                "avg_latency_ms": round(r.avg_latency) if r.avg_latency else None,
            }
            for r in doctor_rows
        ],
        "by_body_part": [
            {"body_part": r.body_part, "total": r.total}
            for r in body_part_rows
        ],
        "top_questions": [
            {
                "question": r.question,
                "doctor_name": r.doctor_name,
                "body_part": r.body_part,
                "times_asked": r.times_asked,
            }
            for r in top_questions
        ],
    }

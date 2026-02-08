"""API endpoints for viewing and exporting tracked patient/provider questions."""

import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import question_tracker

router = APIRouter()


@router.get("")
async def list_questions(
    doctor_id: Optional[str] = None,
    body_part: Optional[str] = None,
    actor: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List tracked questions with optional filters.

    Filterable by doctor, body part, actor type, and date range.
    """
    rows, total = question_tracker.list_questions(
        db,
        doctor_id=doctor_id,
        body_part=body_part,
        actor=actor,
        since=since,
        until=until,
        limit=limit,
        offset=offset,
    )
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "questions": [
            {
                "id": r.id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "actor": r.actor,
                "session_id": r.session_id,
                "question": r.question,
                "doctor_id": r.doctor_id,
                "doctor_name": r.doctor_name,
                "body_part": r.body_part,
                "answer_snippet": r.answer_snippet,
                "citations_count": r.citations_count,
                "latency_ms": r.latency_ms,
                "had_follow_up": r.had_follow_up,
                "follow_up_question": r.follow_up_question,
                "guardrail_triggered": r.guardrail_triggered,
            }
            for r in rows
        ],
    }


@router.get("/analytics")
async def question_analytics(
    doctor_id: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Aggregated analytics: questions per doctor, per body part, actor breakdown, avg latency."""
    return question_tracker.get_analytics(
        db, doctor_id=doctor_id, since=since, until=until
    )


@router.get("/report/weekly")
async def weekly_report(
    week_of: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Weekly usage report with per-doctor breakdown, top questions, and trends.

    Defaults to the most recent completed week (Mon-Sun).
    Pass ?week_of=2026-01-26 to get a specific week's report.
    """
    return question_tracker.get_weekly_report(db, week_of=week_of)


@router.get("/export")
async def export_questions_csv(
    doctor_id: Optional[str] = None,
    body_part: Optional[str] = None,
    actor: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Export filtered questions as a CSV file for research use."""
    rows, _ = question_tracker.list_questions(
        db,
        doctor_id=doctor_id,
        body_part=body_part,
        actor=actor,
        since=since,
        until=until,
        limit=10000,
        offset=0,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id",
        "created_at",
        "actor",
        "session_id",
        "question",
        "doctor_id",
        "doctor_name",
        "body_part",
        "answer_snippet",
        "citations_count",
        "latency_ms",
        "had_follow_up",
        "follow_up_question",
        "guardrail_triggered",
    ])
    for r in rows:
        writer.writerow([
            r.id,
            r.created_at.isoformat() if r.created_at else "",
            r.actor,
            r.session_id or "",
            r.question,
            r.doctor_id or "",
            r.doctor_name or "",
            r.body_part or "",
            r.answer_snippet or "",
            r.citations_count,
            r.latency_ms or "",
            r.had_follow_up,
            r.follow_up_question or "",
            r.guardrail_triggered,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=question_log.csv"},
    )

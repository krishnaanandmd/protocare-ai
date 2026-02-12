import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.core.logging import logger

router = APIRouter()

DEMO_RECIPIENT = os.getenv("DEMO_RECIPIENT", "krishnaanandmd@gmail.com")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


class DemoRequestBody(BaseModel):
    name: str
    email: EmailStr
    organization: str
    role: str = ""
    message: str = ""


@router.post("/request")
async def submit_demo_request(body: DemoRequestBody):
    """Receive a demo request and email it to the team."""

    subject = f"New CareGuide Demo Request — {body.name} ({body.organization})"

    text = (
        f"New demo request received:\n\n"
        f"Name:         {body.name}\n"
        f"Email:        {body.email}\n"
        f"Organization: {body.organization}\n"
        f"Role:         {body.role or '(not specified)'}\n"
        f"Message:      {body.message or '(none)'}\n"
    )

    # If SMTP credentials are not configured, log and return success anyway
    # so the user still sees the confirmation in the UI.
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning(
            "SMTP credentials not configured — demo request logged but not emailed. "
            "Set SMTP_USER and SMTP_PASSWORD env vars to enable email delivery."
        )
        logger.info(f"Demo request from {body.name} <{body.email}> at {body.organization}")
        return {"status": "ok", "emailed": False}

    try:
        recipients = [r.strip() for r in DEMO_RECIPIENT.split(",")]

        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = ", ".join(recipients)
        msg["Reply-To"] = body.email
        msg["Subject"] = subject
        msg.attach(MIMEText(text, "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipients, msg.as_string())

        logger.info(f"Demo request email sent to {DEMO_RECIPIENT} for {body.email}")
        return {"status": "ok", "emailed": True}

    except Exception as exc:
        logger.error(f"Failed to send demo request email: {exc}")
        raise HTTPException(status_code=502, detail="Failed to send email. Please try again later.")

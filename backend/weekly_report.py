#!/usr/bin/env python3
"""Fetch the weekly question report and email a CSV + summary to the team.

Usage:
    # Send the report now:
    python weekly_report.py

    # Specific week:
    python weekly_report.py --week-of 2026-02-01

    # Preview without sending (prints to stdout):
    python weekly_report.py --dry-run

Environment variables (set these in Railway or .env):
    API_URL          - Backend base URL  (default: http://localhost:8000)
    SMTP_HOST        - Mail server       (default: smtp.gmail.com)
    SMTP_PORT        - Mail server port  (default: 587)
    SMTP_USER        - Gmail address used to send
    SMTP_PASSWORD    - Gmail App Password (NOT your regular password)
    REPORT_RECIPIENT - Comma-separated emails (default: krishnaanandmd@gmail.com)
"""

import argparse
import json
import os
import smtplib
import sys
import urllib.request
from datetime import datetime, timezone
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ---------- Config from env ----------
API_URL = os.getenv("API_URL", "http://localhost:8000")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
REPORT_RECIPIENT = os.getenv("REPORT_RECIPIENT", "krishnaanandmd@gmail.com")


def fetch_weekly_json(api_url: str, week_of: str | None = None) -> dict:
    url = f"{api_url}/rag/questions/report/weekly"
    if week_of:
        url += f"?week_of={week_of}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def fetch_csv(api_url: str, since: str, until: str) -> bytes:
    url = f"{api_url}/rag/questions/export?since={since}&until={until}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def format_summary(data: dict) -> str:
    """Build a plain-text email body from the weekly report JSON."""
    period = data["period"]
    s = data["summary"]

    lines = [
        "ProtoCare AI — Weekly Question Report",
        f"{period['start'][:10]}  to  {period['end'][:10]}",
        "",
        f"Total questions:     {s['total_questions']}",
        f"Previous week:       {s['previous_week_total']}  ({'+' if s['week_over_week_change'] >= 0 else ''}{s['week_over_week_change']})",
        f"Unique sessions:     {s['unique_sessions']}",
        f"Avg response time:   {s['avg_latency_ms'] or 'N/A'} ms",
        f"Guardrail triggers:  {s['guardrail_triggers']}",
        "",
    ]

    doctors = data.get("by_doctor", [])
    if doctors:
        lines.append("QUESTIONS BY PROVIDER")
        lines.append("-" * 50)
        for d in doctors:
            name = d["doctor_name"] or d["doctor_id"]
            lines.append(
                f"  {name:<28}  {d['total']:>4} total  "
                f"({d['from_patients']} patient, {d['from_providers']} provider)"
            )
        lines.append("")

    body_parts = data.get("by_body_part", [])
    if body_parts:
        lines.append("QUESTIONS BY BODY PART (CareGuide MSK)")
        lines.append("-" * 50)
        for bp in body_parts:
            lines.append(f"  {bp['body_part']:<28}  {bp['total']:>4}")
        lines.append("")

    top_qs = data.get("top_questions", [])
    if top_qs:
        lines.append("TOP QUESTIONS")
        lines.append("-" * 50)
        for i, q in enumerate(top_qs, 1):
            target = q["doctor_name"] or q["body_part"] or "general"
            text = q["question"][:80] + ("..." if len(q["question"]) > 80 else "")
            lines.append(f"  {i:>2}. [{target}] ({q['times_asked']}x)")
            lines.append(f"      \"{text}\"")
        lines.append("")

    lines.append("Full data attached as CSV.")
    return "\n".join(lines)


def send_email(subject: str, body: str, csv_bytes: bytes, csv_filename: str):
    recipients = [r.strip() for r in REPORT_RECIPIENT.split(",")]

    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    attachment = MIMEBase("text", "csv")
    attachment.set_payload(csv_bytes)
    encoders.encode_base64(attachment)
    attachment.add_header("Content-Disposition", f"attachment; filename={csv_filename}")
    msg.attach(attachment)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, recipients, msg.as_string())


def main():
    parser = argparse.ArgumentParser(description="Email weekly ProtoCare question report")
    parser.add_argument("--api-url", default=API_URL)
    parser.add_argument("--week-of", default=None, help="Date within the target week (YYYY-MM-DD)")
    parser.add_argument("--dry-run", action="store_true", help="Print report without sending email")
    parser.add_argument("--json", action="store_true", help="Print raw JSON")
    args = parser.parse_args()

    # 1. Fetch the weekly summary
    report = fetch_weekly_json(args.api_url, args.week_of)

    if args.json:
        print(json.dumps(report, indent=2))
        return

    summary_text = format_summary(report)

    if args.dry_run:
        print(summary_text)
        return

    # 2. Fetch the raw CSV for the same period
    period = report["period"]
    csv_bytes = fetch_csv(args.api_url, period["start"], period["end"])

    # 3. Email it
    week_label = period["start"][:10]
    subject = f"ProtoCare Weekly Report — {week_label}"
    csv_filename = f"protocare_questions_{week_label}.csv"

    if not SMTP_USER or not SMTP_PASSWORD:
        print("ERROR: SMTP_USER and SMTP_PASSWORD env vars are required to send email.", file=sys.stderr)
        print("Set these in Railway variables or your .env file.", file=sys.stderr)
        print("\nReport preview:\n")
        print(summary_text)
        sys.exit(1)

    send_email(subject, summary_text, csv_bytes, csv_filename)
    print(f"Report sent to {REPORT_RECIPIENT} for week of {week_label}")


if __name__ == "__main__":
    main()

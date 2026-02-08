#!/usr/bin/env python3
"""Fetch the weekly question report and print a formatted summary.

Usage:
    # Most recent completed week (Mon-Sun):
    python weekly_report.py

    # Specific week:
    python weekly_report.py --week-of 2026-02-01

    # Custom API base URL:
    python weekly_report.py --api-url https://api.care-guide.ai

    # Automate with cron (every Monday at 8am):
    # 0 8 * * 1  cd /path/to/backend && python weekly_report.py >> /var/log/weekly_report.log 2>&1
"""

import argparse
import json
import os
import sys
import urllib.request

DEFAULT_API_URL = os.getenv("API_URL", "http://localhost:8000")


def fetch_report(api_url: str, week_of: str | None = None) -> dict:
    url = f"{api_url}/rag/questions/report/weekly"
    if week_of:
        url += f"?week_of={week_of}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def format_report(data: dict) -> str:
    lines = []
    period = data["period"]
    summary = data["summary"]

    lines.append("=" * 60)
    lines.append("  PROTOCARE AI — WEEKLY QUESTION REPORT")
    lines.append(f"  {period['start'][:10]}  to  {period['end'][:10]}")
    lines.append("=" * 60)
    lines.append("")

    # Summary
    change = summary["week_over_week_change"]
    arrow = "+" if change > 0 else "" if change == 0 else ""
    lines.append(f"  Total questions:    {summary['total_questions']}")
    lines.append(f"  Previous week:      {summary['previous_week_total']}  ({arrow}{change})")
    lines.append(f"  Unique sessions:    {summary['unique_sessions']}")
    latency = summary.get("avg_latency_ms")
    lines.append(f"  Avg response time:  {latency} ms" if latency else "  Avg response time:  N/A")
    lines.append(f"  Guardrail triggers: {summary['guardrail_triggers']}")
    lines.append("")

    # Per-doctor
    doctors = data.get("by_doctor", [])
    if doctors:
        lines.append("-" * 60)
        lines.append("  QUESTIONS BY PROVIDER")
        lines.append("-" * 60)
        for d in doctors:
            name = d["doctor_name"] or d["doctor_id"]
            lines.append(
                f"  {name:<30}  {d['total']:>4} total  "
                f"({d['from_patients']} patient, {d['from_providers']} provider)"
            )
        lines.append("")

    # Per body part
    body_parts = data.get("by_body_part", [])
    if body_parts:
        lines.append("-" * 60)
        lines.append("  QUESTIONS BY BODY PART (CareGuide MSK)")
        lines.append("-" * 60)
        for bp in body_parts:
            lines.append(f"  {bp['body_part']:<30}  {bp['total']:>4}")
        lines.append("")

    # Top questions
    top_qs = data.get("top_questions", [])
    if top_qs:
        lines.append("-" * 60)
        lines.append("  TOP QUESTIONS")
        lines.append("-" * 60)
        for i, q in enumerate(top_qs, 1):
            target = q["doctor_name"] or q["body_part"] or "general"
            times = q["times_asked"]
            text = q["question"][:80] + ("..." if len(q["question"]) > 80 else "")
            lines.append(f"  {i:>2}. [{target}] ({times}x)")
            lines.append(f"      \"{text}\"")
        lines.append("")

    lines.append("=" * 60)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Fetch and display weekly question report")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Backend API base URL")
    parser.add_argument("--week-of", default=None, help="Date within the target week (YYYY-MM-DD)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON instead of formatted text")
    args = parser.parse_args()

    try:
        data = fetch_report(args.api_url, args.week_of)
    except Exception as e:
        print(f"Error fetching report: {e}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(format_report(data))


if __name__ == "__main__":
    main()

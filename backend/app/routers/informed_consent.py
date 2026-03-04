"""
Informed Consent Verification Tool
===================================
Multi-turn conversational AI that walks a patient through their informed consent
document, verifies understanding of risks/benefits/alternatives, and generates
a transcript proving comprehension — emailed to the selected physician and
stored in the system.

Endpoints:
  POST /consent/session       – Start a new consent session
  POST /consent/chat          – Send a patient message & receive AI response
  POST /consent/complete      – Finalize session, generate transcript, email physician
  GET  /consent/session/{id}  – Retrieve session + transcript
  GET  /consent/physicians    – List available physicians (subset for consent tool)
"""

import os
import re
import smtplib
import time
import uuid
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.core.logging import logger
from app.services import retrieval

router = APIRouter()

# ── SMTP config (reuses same env vars as demo_request) ─────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

# ── Physicians available for informed consent ──────────────────────────
CONSENT_PHYSICIANS = {
    "joshua_dines": {
        "id": "joshua_dines",
        "name": "Dr. Joshua Dines",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "email": os.getenv("PHYSICIAN_EMAIL_DINES", ""),
    },
    "asheesh_bedi": {
        "id": "asheesh_bedi",
        "name": "Dr. Asheesh Bedi",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "email": os.getenv("PHYSICIAN_EMAIL_BEDI", ""),
    },
}

# ── Diagnoses & procedures by physician ────────────────────────────────
PHYSICIAN_DIAGNOSES = {
    "joshua_dines": [
        {
            "id": "rotator_cuff_tear",
            "name": "Rotator Cuff Tear",
            "procedures": [
                {"id": "rotator_cuff_repair", "name": "Rotator Cuff Repair"},
                {"id": "rotator_cuff_reconstruction", "name": "Rotator Cuff Reconstruction"},
            ],
        },
        {
            "id": "shoulder_instability",
            "name": "Shoulder Instability",
            "procedures": [
                {"id": "bankart_repair", "name": "Bankart Repair"},
                {"id": "latarjet_procedure", "name": "Latarjet Procedure"},
            ],
        },
        {
            "id": "labral_tear_slap",
            "name": "Labral Tear (SLAP)",
            "procedures": [
                {"id": "slap_repair", "name": "SLAP Repair"},
                {"id": "biceps_tenodesis", "name": "Biceps Tenodesis"},
            ],
        },
        {
            "id": "ucl_injury",
            "name": "UCL Injury",
            "procedures": [
                {"id": "ucl_reconstruction", "name": "UCL Reconstruction (Tommy John)"},
                {"id": "ucl_repair", "name": "UCL Repair"},
            ],
        },
        {
            "id": "acl_tear",
            "name": "ACL Tear",
            "procedures": [
                {"id": "acl_reconstruction", "name": "ACL Reconstruction"},
                {"id": "acl_repair", "name": "ACL Repair"},
            ],
        },
        {
            "id": "meniscus_tear",
            "name": "Meniscus Tear",
            "procedures": [
                {"id": "meniscus_repair", "name": "Meniscus Repair"},
                {"id": "partial_meniscectomy", "name": "Partial Meniscectomy"},
            ],
        },
        {
            "id": "ac_joint_injury",
            "name": "AC Joint Injury",
            "procedures": [
                {"id": "ac_joint_reconstruction", "name": "AC Joint Reconstruction"},
                {"id": "distal_clavicle_excision", "name": "Distal Clavicle Excision"},
            ],
        },
    ],
    "asheesh_bedi": [
        {
            "id": "rotator_cuff_tear",
            "name": "Rotator Cuff Tear",
            "procedures": [
                {"id": "rotator_cuff_repair", "name": "Rotator Cuff Repair"},
                {"id": "rotator_cuff_reconstruction", "name": "Rotator Cuff Reconstruction"},
            ],
        },
        {
            "id": "shoulder_instability",
            "name": "Shoulder Instability",
            "procedures": [
                {"id": "bankart_repair", "name": "Bankart Repair"},
                {"id": "latarjet_procedure", "name": "Latarjet Procedure"},
            ],
        },
        {
            "id": "labral_tear_slap",
            "name": "Labral Tear (SLAP)",
            "procedures": [
                {"id": "slap_repair", "name": "SLAP Repair"},
                {"id": "biceps_tenodesis", "name": "Biceps Tenodesis"},
            ],
        },
        {
            "id": "ucl_injury",
            "name": "UCL Injury",
            "procedures": [
                {"id": "ucl_reconstruction", "name": "UCL Reconstruction (Tommy John)"},
                {"id": "ucl_repair", "name": "UCL Repair"},
            ],
        },
        {
            "id": "acl_tear",
            "name": "ACL Tear",
            "procedures": [
                {"id": "acl_reconstruction", "name": "ACL Reconstruction"},
                {"id": "acl_repair", "name": "ACL Repair"},
            ],
        },
        {
            "id": "meniscus_tear",
            "name": "Meniscus Tear",
            "procedures": [
                {"id": "meniscus_repair", "name": "Meniscus Repair"},
                {"id": "partial_meniscectomy", "name": "Partial Meniscectomy"},
            ],
        },
        {
            "id": "hip_labral_tear",
            "name": "Hip Labral Tear",
            "procedures": [
                {"id": "hip_arthroscopy", "name": "Hip Arthroscopy"},
                {"id": "labral_repair_hip", "name": "Labral Repair (Hip)"},
            ],
        },
        {
            "id": "fai",
            "name": "Femoroacetabular Impingement (FAI)",
            "procedures": [
                {"id": "hip_arthroscopy_fai", "name": "Hip Arthroscopy"},
                {"id": "osteoplasty", "name": "Osteoplasty"},
            ],
        },
    ],
}

# ── In-memory session store (production would use a database) ──────────
_sessions: dict[str, dict] = {}


# ── Pydantic schemas ──────────────────────────────────────────────────

class ConsentPhysician(BaseModel):
    id: str
    name: str
    specialty: str


class DiagnosisProcedure(BaseModel):
    id: str
    name: str


class DiagnosisInfo(BaseModel):
    id: str
    name: str
    procedures: List[DiagnosisProcedure]


class StartSessionRequest(BaseModel):
    physician_id: str
    diagnosis_id: str
    procedure_id: str
    patient_name: str


class StartSessionResponse(BaseModel):
    session_id: str
    physician_name: str
    diagnosis_name: str
    procedure_name: str
    greeting: str


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
    phase: str  # "education" | "verification" | "complete"
    understanding_score: Optional[int] = None  # 0-100
    topics_covered: List[str] = []
    ready_to_complete: bool = False


class CompleteSessionRequest(BaseModel):
    session_id: str
    patient_confirms_consent: bool


class TranscriptEntry(BaseModel):
    role: str  # "assistant" | "patient"
    message: str
    timestamp: str


class CompleteSessionResponse(BaseModel):
    session_id: str
    transcript: List[TranscriptEntry]
    summary: str
    understanding_verified: bool
    patient_consented: bool
    emailed: bool
    completed_at: str


class SessionDetailResponse(BaseModel):
    session_id: str
    physician_name: str
    diagnosis_name: str
    procedure_name: str
    patient_name: str
    status: str
    transcript: List[TranscriptEntry]
    summary: Optional[str] = None
    understanding_verified: bool
    patient_consented: bool
    completed_at: Optional[str] = None
    created_at: str


# ── Helper: build conversation context for Claude ─────────────────────

def _build_system_prompt(session: dict) -> str:
    """Build the informed consent conversation system prompt."""
    physician_name = session["physician_name"]
    diagnosis_name = session["diagnosis_name"]
    procedure_name = session["procedure_name"]
    patient_name = session["patient_name"]
    phase = session.get("phase", "education")

    base = f"""You are an informed consent verification assistant for {physician_name}'s practice at CareGuide.

PATIENT INFORMATION:
- Patient Name: {patient_name}
- Diagnosis: {diagnosis_name}
- Planned Procedure: {procedure_name}
- Physician: {physician_name}

YOUR ROLE:
You are helping verify that the patient ({patient_name}) understands their informed consent for {procedure_name}.
You must ensure the patient understands:

1. **What the procedure involves** — what will be done during surgery
2. **Why it is recommended** — how it addresses their diagnosis ({diagnosis_name})
3. **Key risks and potential complications** — infection, nerve damage, blood clots, anesthesia risks, procedure-specific risks
4. **Expected benefits and realistic outcomes** — pain relief, improved function, return to activity
5. **Alternative treatments** — conservative options (physical therapy, injections, bracing), other surgical approaches, doing nothing
6. **Recovery expectations** — general timeline, restrictions, physical therapy requirements
7. **The right to refuse** — the patient can decline or seek a second opinion at any time

CONVERSATION GUIDELINES:
- Be warm, empathetic, and patient-friendly. Use clear, non-medical jargon where possible.
- Address the patient by their first name ({patient_name.split()[0] if patient_name.strip() else 'there'}).
- Explain concepts one topic at a time — do not overwhelm with all information at once.
- After explaining each topic, ask a simple comprehension check question to verify understanding.
- If the patient seems confused, re-explain in simpler terms.
- Be thorough but conversational — this should feel like a supportive discussion, not a lecture.
- NEVER rush through topics. Each area of informed consent is important.
- Use the knowledge from {physician_name}'s protocols when available.

IMPORTANT RULES:
- You are NOT providing medical advice — you are verifying the patient understands what has already been discussed with their surgeon.
- If the patient asks clinical questions beyond the scope of informed consent, advise them to discuss with {physician_name} directly.
- Always remind the patient this conversation supplements (does not replace) their in-person discussion with their surgeon.
"""

    if phase == "education":
        base += """
CURRENT PHASE: EDUCATION
You are currently educating the patient and checking their understanding of each topic.
Track which topics you have covered. After each topic, ask a comprehension question.

Topics to cover:
- Procedure description
- Risks and complications
- Benefits and expected outcomes
- Alternatives to surgery
- Recovery expectations
- Right to refuse

After covering all topics and verifying comprehension, transition to the VERIFICATION phase
by telling the patient you'd like to do a brief review.

At the end of each of your messages, include a hidden status line (the patient won't see this):
CONSENT_STATUS: topics_covered=[list topics covered so far] | understanding_score=[0-100] | phase=[education|verification|complete]
"""
    elif phase == "verification":
        base += """
CURRENT PHASE: VERIFICATION
You have covered all major topics. Now do a brief summary review:
1. Summarize the key points discussed.
2. Ask the patient if they have any remaining questions.
3. Confirm they understand the risks, benefits, and alternatives.
4. Ask if they would like to proceed with the surgery.

When the patient confirms understanding and willingness to proceed, set phase to "complete".

At the end of each of your messages, include a hidden status line:
CONSENT_STATUS: topics_covered=[list all topics] | understanding_score=[0-100] | phase=[education|verification|complete]
"""
    else:
        base += """
CURRENT PHASE: COMPLETE
The patient has demonstrated understanding and expressed willingness to proceed.
Thank them and let them know a transcript will be sent to their physician.

At the end of each of your messages, include a hidden status line:
CONSENT_STATUS: topics_covered=[procedure,risks,benefits,alternatives,recovery,right_to_refuse] | understanding_score=[score] | phase=complete
"""

    return base


def _build_messages(session: dict, new_message: Optional[str] = None) -> list[dict]:
    """Build the message history for the Claude API call."""
    messages = []
    for entry in session["transcript"]:
        role = "assistant" if entry["role"] == "assistant" else "user"
        messages.append({"role": role, "content": entry["message"]})
    if new_message:
        messages.append({"role": "user", "content": new_message})
    return messages


def _parse_consent_status(text: str) -> dict:
    """Extract the hidden CONSENT_STATUS line from the AI response."""
    status = {
        "topics_covered": [],
        "understanding_score": 0,
        "phase": "education",
    }
    match = re.search(
        r"CONSENT_STATUS:\s*topics_covered=\[([^\]]*)\]\s*\|\s*understanding_score=\[?(\d+)\]?\s*\|\s*phase=(\w+)",
        text,
    )
    if match:
        topics_str = match.group(1).strip()
        if topics_str:
            status["topics_covered"] = [t.strip() for t in topics_str.split(",")]
        status["understanding_score"] = int(match.group(2))
        status["phase"] = match.group(3)
    return status


def _strip_consent_status(text: str) -> str:
    """Remove the hidden CONSENT_STATUS line from visible response."""
    return re.sub(r"\n*CONSENT_STATUS:.*$", "", text, flags=re.MULTILINE).strip()


def _generate_summary(session: dict) -> str:
    """Use Claude to generate a formal summary of the consent conversation."""
    physician_name = session["physician_name"]
    patient_name = session["patient_name"]
    diagnosis_name = session["diagnosis_name"]
    procedure_name = session["procedure_name"]

    transcript_text = "\n".join(
        f"{'Assistant' if e['role'] == 'assistant' else 'Patient'}: {e['message']}"
        for e in session["transcript"]
    )

    system_prompt = f"""You are a medical documentation assistant. Generate a formal informed consent verification summary.

This summary will be sent to {physician_name} as documentation that the patient understood their informed consent."""

    user_prompt = f"""Based on the following informed consent conversation, generate a formal summary document.

PATIENT: {patient_name}
DIAGNOSIS: {diagnosis_name}
PROCEDURE: {procedure_name}
PHYSICIAN: {physician_name}
DATE: {datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")}

CONVERSATION TRANSCRIPT:
{transcript_text}

Generate a summary with the following sections:
1. **Patient Information** — Name, diagnosis, planned procedure, physician
2. **Topics Discussed** — List each informed consent topic that was covered
3. **Patient Understanding** — Summary of the patient's demonstrated comprehension
4. **Questions Raised** — Any questions the patient asked and how they were addressed
5. **Patient Decision** — Whether the patient expressed willingness to proceed
6. **Verification Statement** — A formal statement that informed consent was verified through this AI-assisted conversation

Keep it concise, professional, and factual. This is a medical-legal document."""

    try:
        ac = retrieval.anthropic_client()
        response = ac.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2048,
            temperature=0,
            system=[{"type": "text", "text": system_prompt}],
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.content[0].text if response.content else "Summary generation failed."
    except Exception as e:
        logger.error("consent_summary_generation_failed", error=str(e))
        return f"Summary could not be generated automatically. Error: {str(e)}"


def _send_consent_email(session: dict, summary: str) -> bool:
    """Email the consent transcript and summary to the physician."""
    physician = CONSENT_PHYSICIANS.get(session["physician_id"], {})
    physician_email = physician.get("email", "")

    if not physician_email:
        logger.warning(
            "consent_email_skipped_no_physician_email",
            physician_id=session["physician_id"],
        )
        # Fall back to default recipient
        physician_email = os.getenv("DEMO_RECIPIENT", "krishnaanandmd@gmail.com")

    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — consent transcript logged but not emailed.")
        return False

    patient_name = session["patient_name"]
    procedure_name = session["procedure_name"]
    physician_name = session["physician_name"]
    completed_at = session.get("completed_at", datetime.now(timezone.utc).isoformat())

    subject = f"Informed Consent Verification — {patient_name} | {procedure_name}"

    # Build transcript text
    transcript_lines = []
    for entry in session["transcript"]:
        role_label = "CareGuide Assistant" if entry["role"] == "assistant" else f"Patient ({patient_name})"
        transcript_lines.append(f"[{entry['timestamp']}] {role_label}:\n{entry['message']}\n")

    body = f"""INFORMED CONSENT VERIFICATION REPORT
{'=' * 50}

Physician: {physician_name}
Patient: {patient_name}
Procedure: {procedure_name}
Diagnosis: {session['diagnosis_name']}
Session ID: {session['session_id']}
Completed: {completed_at}

{'=' * 50}
SUMMARY
{'=' * 50}

{summary}

{'=' * 50}
FULL CONVERSATION TRANSCRIPT
{'=' * 50}

{"".join(transcript_lines)}

{'=' * 50}
This report was generated by CareGuide's Informed Consent Verification Tool.
It supplements — but does not replace — the physician-patient informed consent discussion.
{'=' * 50}
"""

    try:
        recipients = [r.strip() for r in physician_email.split(",")]

        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipients, msg.as_string())

        logger.info(
            "consent_email_sent",
            physician=physician_name,
            patient=patient_name,
            recipients=recipients,
        )
        return True
    except Exception as e:
        logger.error("consent_email_failed", error=str(e))
        return False


# ── API Endpoints ─────────────────────────────────────────────────────

@router.get("/physicians", response_model=list[ConsentPhysician])
async def list_consent_physicians():
    """Return physicians available for the informed consent tool."""
    return [
        ConsentPhysician(id=p["id"], name=p["name"], specialty=p["specialty"])
        for p in CONSENT_PHYSICIANS.values()
    ]


@router.get("/physicians/{physician_id}/diagnoses", response_model=list[DiagnosisInfo])
async def get_physician_diagnoses(physician_id: str):
    """Return diagnoses and procedures for a specific physician."""
    if physician_id not in PHYSICIAN_DIAGNOSES:
        raise HTTPException(status_code=404, detail="Physician not found")
    return [
        DiagnosisInfo(
            id=d["id"],
            name=d["name"],
            procedures=[DiagnosisProcedure(**p) for p in d["procedures"]],
        )
        for d in PHYSICIAN_DIAGNOSES[physician_id]
    ]


@router.post("/session", response_model=StartSessionResponse)
async def start_consent_session(body: StartSessionRequest):
    """Start a new informed consent verification session."""
    physician = CONSENT_PHYSICIANS.get(body.physician_id)
    if not physician:
        raise HTTPException(status_code=404, detail="Physician not found")

    # Find diagnosis and procedure names
    diagnoses = PHYSICIAN_DIAGNOSES.get(body.physician_id, [])
    diagnosis_name = None
    procedure_name = None
    for d in diagnoses:
        if d["id"] == body.diagnosis_id:
            diagnosis_name = d["name"]
            for p in d["procedures"]:
                if p["id"] == body.procedure_id:
                    procedure_name = p["name"]
                    break
            break

    if not diagnosis_name:
        raise HTTPException(status_code=400, detail="Invalid diagnosis")
    if not procedure_name:
        raise HTTPException(status_code=400, detail="Invalid procedure")

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    session = {
        "session_id": session_id,
        "physician_id": body.physician_id,
        "physician_name": physician["name"],
        "diagnosis_id": body.diagnosis_id,
        "diagnosis_name": diagnosis_name,
        "procedure_id": body.procedure_id,
        "procedure_name": procedure_name,
        "patient_name": body.patient_name,
        "status": "active",
        "phase": "education",
        "transcript": [],
        "topics_covered": [],
        "understanding_score": 0,
        "summary": None,
        "understanding_verified": False,
        "patient_consented": False,
        "completed_at": None,
        "created_at": now,
    }

    # Generate the opening greeting with Claude
    system_prompt = _build_system_prompt(session)
    first_name = body.patient_name.split()[0] if body.patient_name.strip() else "there"

    opening_prompt = (
        f"The patient {body.patient_name} has just started the informed consent verification process "
        f"for {procedure_name} to address their {diagnosis_name}. "
        f"Their physician is {physician['name']}. "
        f"Please introduce yourself, explain the purpose of this conversation, and begin by explaining "
        f"what the {procedure_name} procedure involves. Keep it warm, supportive, and conversational. "
        f"Address the patient as {first_name}."
    )

    try:
        ac = retrieval.anthropic_client()
        response = ac.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            temperature=0.3,
            system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": opening_prompt}],
        )
        greeting = response.content[0].text if response.content else (
            f"Hello {first_name}! I'm here to help walk you through the informed consent process for your "
            f"upcoming {procedure_name}. Let's start by talking about what the procedure involves."
        )
    except Exception as e:
        logger.error("consent_greeting_generation_failed", error=str(e))
        greeting = (
            f"Hello {first_name}! I'm here to help walk you through the informed consent process for your "
            f"upcoming {procedure_name} with {physician['name']}. "
            f"I'll explain the key aspects of the procedure, the risks and benefits, and alternatives, "
            f"and I'll check to make sure you understand everything. Let's get started!\n\n"
            f"First, let me explain what {procedure_name} involves."
        )

    # Parse status from greeting and clean it
    status_info = _parse_consent_status(greeting)
    greeting = _strip_consent_status(greeting)

    session["transcript"].append({
        "role": "assistant",
        "message": greeting,
        "timestamp": now,
    })
    if status_info["topics_covered"]:
        session["topics_covered"] = status_info["topics_covered"]

    _sessions[session_id] = session

    logger.info(
        "consent_session_started",
        session_id=session_id,
        physician=physician["name"],
        patient=body.patient_name,
        procedure=procedure_name,
    )

    return StartSessionResponse(
        session_id=session_id,
        physician_name=physician["name"],
        diagnosis_name=diagnosis_name,
        procedure_name=procedure_name,
        greeting=greeting,
    )


@router.post("/chat", response_model=ChatResponse)
async def consent_chat(body: ChatRequest):
    """Process a patient message in the informed consent conversation."""
    session = _sessions.get(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is no longer active")

    now = datetime.now(timezone.utc).isoformat()

    # Add patient message to transcript
    session["transcript"].append({
        "role": "patient",
        "message": body.message,
        "timestamp": now,
    })

    # Build conversation context
    system_prompt = _build_system_prompt(session)
    messages = _build_messages(session)

    try:
        ac = retrieval.anthropic_client()
        response = ac.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1500,
            temperature=0.3,
            system=[{"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}],
            messages=messages,
        )
        ai_response = response.content[0].text if response.content else "I'm sorry, I had trouble generating a response. Could you repeat that?"
    except Exception as e:
        logger.error("consent_chat_failed", error=str(e), session_id=body.session_id)
        ai_response = "I'm experiencing a temporary issue. Let me continue — could you repeat your last response?"

    # Parse status and clean response
    status_info = _parse_consent_status(ai_response)
    clean_response = _strip_consent_status(ai_response)

    # Update session state
    if status_info["topics_covered"]:
        session["topics_covered"] = status_info["topics_covered"]
    if status_info["understanding_score"]:
        session["understanding_score"] = status_info["understanding_score"]
    if status_info["phase"] in ("education", "verification", "complete"):
        session["phase"] = status_info["phase"]

    # Add AI response to transcript
    response_timestamp = datetime.now(timezone.utc).isoformat()
    session["transcript"].append({
        "role": "assistant",
        "message": clean_response,
        "timestamp": response_timestamp,
    })

    ready_to_complete = session["phase"] == "complete" and session["understanding_score"] >= 70

    logger.info(
        "consent_chat_turn",
        session_id=body.session_id,
        phase=session["phase"],
        topics_covered=session["topics_covered"],
        understanding_score=session["understanding_score"],
    )

    return ChatResponse(
        response=clean_response,
        phase=session["phase"],
        understanding_score=session["understanding_score"],
        topics_covered=session["topics_covered"],
        ready_to_complete=ready_to_complete,
    )


@router.post("/complete", response_model=CompleteSessionResponse)
async def complete_consent_session(body: CompleteSessionRequest):
    """Finalize the consent session: generate summary, email physician."""
    session = _sessions.get(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session already completed")

    now = datetime.now(timezone.utc).isoformat()

    # Mark consent decision
    session["patient_consented"] = body.patient_confirms_consent
    session["understanding_verified"] = session["understanding_score"] >= 70
    session["status"] = "completed"
    session["completed_at"] = now

    # Generate formal summary
    summary = _generate_summary(session)
    session["summary"] = summary

    # Email the transcript and summary to the physician
    emailed = _send_consent_email(session, summary)

    logger.info(
        "consent_session_completed",
        session_id=body.session_id,
        patient=session["patient_name"],
        physician=session["physician_name"],
        consented=body.patient_confirms_consent,
        understanding_score=session["understanding_score"],
        emailed=emailed,
    )

    transcript = [
        TranscriptEntry(
            role=e["role"],
            message=e["message"],
            timestamp=e["timestamp"],
        )
        for e in session["transcript"]
    ]

    return CompleteSessionResponse(
        session_id=body.session_id,
        transcript=transcript,
        summary=summary,
        understanding_verified=session["understanding_verified"],
        patient_consented=body.patient_confirms_consent,
        emailed=emailed,
        completed_at=now,
    )


@router.get("/session/{session_id}", response_model=SessionDetailResponse)
async def get_consent_session(session_id: str):
    """Retrieve a consent session and its transcript."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    transcript = [
        TranscriptEntry(
            role=e["role"],
            message=e["message"],
            timestamp=e["timestamp"],
        )
        for e in session["transcript"]
    ]

    return SessionDetailResponse(
        session_id=session_id,
        physician_name=session["physician_name"],
        diagnosis_name=session["diagnosis_name"],
        procedure_name=session["procedure_name"],
        patient_name=session["patient_name"],
        status=session["status"],
        transcript=transcript,
        summary=session.get("summary"),
        understanding_verified=session.get("understanding_verified", False),
        patient_consented=session.get("patient_consented", False),
        completed_at=session.get("completed_at"),
        created_at=session["created_at"],
    )

from pydantic import BaseModel
from typing import List, Optional

class Citation(BaseModel):
    title: str
    document_id: str
    page: Optional[int] = None
    section: Optional[str] = None
    author: Optional[str] = None
    publication_year: Optional[int] = None
    document_url: Optional[str] = None  # Presigned URL to view the document
    display_label: Optional[str] = None  # Simplified label shown in UI (e.g. "Dr. Bedi protocol")

class Answer(BaseModel):
    answer: str
    citations: List[Citation]
    guardrails: dict
    latency_ms: int
    follow_up_question: Optional[str] = None

class QueryRequest(BaseModel):
    question: str
    actor: str  # PROVIDER | PATIENT
    doctor_id: Optional[str] = None  # e.g., "joshua_dines"
    body_part: Optional[str] = None  # e.g., "shoulder", "knee", "elbow"
    org_id: str = "demo"  # Legacy - will be replaced by doctor_id_procedure

class UploadInitResponse(BaseModel):
    upload_url: str
    document_id: str

class DoctorProfile(BaseModel):
    id: str
    name: str
    specialty: str
    procedures: List[str]

class ProcedureInfo(BaseModel):
    id: str
    name: str
    description: str

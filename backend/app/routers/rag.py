import time
from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, Answer, Citation, DoctorProfile
from app.core.logging import logger
from app.services import retrieval

router = APIRouter()

@router.get("/debug/env")
async def debug_environment():
    """Check which Qdrant the API is connected to."""
    return {
        "qdrant_url": settings.qdrant_url,
        "s3_bucket": settings.s3_bucket
    }

@router.get("/debug/collections")  
async def list_collections():
    """List all collections."""
    try:
        c = retrieval.client()
        collections = c.get_collections().collections
        return {
            "total": len(collections),
            "collections": [
                {"name": col.name, "vectors": col.vectors_count}
                for col in collections
            ]
        }
    except Exception as e:
        return {"error": str(e)}





# Sample doctor profiles (in production, this would be a database)
DOCTORS = {
    "joshua_dines": {
        "id": "joshua_dines",
        "name": "Dr. Joshua Dines",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "procedures": ["ucl", "acl", "rotator_cuff"]
    }
}

PROCEDURES = {
    "ucl": {"id": "ucl", "name": "UCL Reconstruction (Tommy John)", "description": "Ulnar collateral ligament reconstruction"},
    "acl": {"id": "acl", "name": "ACL Reconstruction", "description": "Anterior cruciate ligament reconstruction"},
    "rotator_cuff": {"id": "rotator_cuff", "name": "Rotator Cuff Repair", "description": "Surgical repair of torn rotator cuff"}
}

def slugify(text):
    """Convert text to slug."""
    return text.lower().replace(" ", "_").replace(".", "")

@router.get("/doctors", response_model=list[DoctorProfile])
async def list_doctors():
    """Get list of available doctors."""
    return [DoctorProfile(**doc) for doc in DOCTORS.values()]

@router.get("/doctors/{doctor_id}/procedures")
async def list_procedures(doctor_id: str):
    """Get procedures for a specific doctor."""
    if doctor_id not in DOCTORS:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doctor = DOCTORS[doctor_id]
    return [PROCEDURES[proc_id] for proc_id in doctor["procedures"] if proc_id in PROCEDURES]

@router.post("/query", response_model=Answer)
async def rag_query(body: QueryRequest):
    t0 = time.time()
    q = body.question.strip()

    # Guardrails
    ql = q.lower()
    if any(x in ql for x in ["chest pain", "shortness of breath", "suicid", "overdose"]):
        raise HTTPException(
            status_code=400, 
            detail="This service can't provide emergency advice. Call your local emergency number."
        )

    # Determine collection(s) to search
    doctor_name = None
    procedure_name = None
    collections_to_search = []
    
    if body.doctor_id:
        doctor_slug = slugify(body.doctor_id)
        doctor_name = DOCTORS.get(body.doctor_id, {}).get("name", body.doctor_id)
        
        if body.procedure:
            # Search specific procedure collection
            procedure_slug = slugify(body.procedure)
            collections_to_search = [f"dr_{doctor_slug}_{procedure_slug}"]
            procedure_name = PROCEDURES.get(body.procedure, {}).get("name", body.procedure)
        else:
            # Search ALL collections for this doctor
            c = retrieval.client()
            all_collections = c.get_collections().collections
            doctor_prefix = f"dr_{doctor_slug}_"
            collections_to_search = [
                col.name for col in all_collections 
                if col.name.startswith(doctor_prefix)
            ]
            logger.info("searching_all_doctor_collections", doctor=doctor_slug, collections=len(collections_to_search))
    else:
        # Fallback to demo collection
        collections_to_search = ["org_demo_chunks"]

    # Search across all relevant collections and aggregate results
    all_hits = []
    for collection_name in collections_to_search:
        try:
            retrieval.ensure_collection(collection_name)
            hits = retrieval.search(q, top_k=8, collection_name=collection_name)
            all_hits.extend(hits)
        except Exception as e:
            logger.warning("collection_search_failed", collection=collection_name, error=str(e))
    
    # Sort by score and take top results
    all_hits.sort(key=lambda h: h.score, reverse=True)
    hits = all_hits[:8]

    if not hits:
        if doctor_name:
            answer_text = f"I couldn't find specific protocols from {doctor_name}. Please contact the office for details."
        else:
            answer_text = "I couldn't find an approved orthopedic source for that. Please contact your clinic."
        citations = []
    else:
        context_parts = []
        citations = []
        
        for i, h in enumerate(hits[:6]):
            p = h.payload or {}
            text = p.get("text", "")
            title = p.get("title", "Unknown")
            doc_id = p.get("document_id", "unknown")
            page = p.get("page")
            section = p.get("section")
            
            context_parts.append(f"[Source {i+1}: {title}]\n{text}\n")
            
            if i < 4:
                citations.append(
                    Citation(
                        title=title,
                        document_id=doc_id,
                        page=page,
                        section=section,
                    )
                )
        
        context = "\n".join(context_parts)
        
        if body.actor == "PROVIDER":
            if doctor_name and procedure_name:
                system_prompt = f"""You are a clinical assistant helping providers understand Dr. {doctor_name}'s protocols for {procedure_name}.

Guidelines:
- Provide evidence-based answers using ONLY the provided protocols
- Use appropriate medical terminology
- Include specific clinical details from Dr. {doctor_name}'s preferences
- If protocols are unclear, acknowledge limitations
- Never fabricate information"""
            elif doctor_name:
                system_prompt = f"""You are a clinical assistant helping providers understand Dr. {doctor_name}'s protocols.

Guidelines:
- Provide evidence-based answers using ONLY the provided protocols
- Use appropriate medical terminology
- Include specific clinical details from Dr. {doctor_name}'s preferences
- If protocols are unclear, acknowledge limitations
- Never fabricate information"""
            else:
                system_prompt = """You are a clinical decision support assistant. Provide evidence-based answers using ONLY the provided sources."""
        else:
            if doctor_name and procedure_name:
                system_prompt = f"""You are a patient education assistant explaining Dr. {doctor_name}'s approach to {procedure_name}.

Guidelines:
- Use clear, patient-friendly language
- Base answers strictly on Dr. {doctor_name}'s protocols
- Encourage patients to discuss specifics with their care team
- Never provide medical advice or fabricate information"""
            elif doctor_name:
                system_prompt = f"""You are a patient education assistant explaining Dr. {doctor_name}'s treatment approaches.

Guidelines:
- Use clear, patient-friendly language
- Base answers strictly on Dr. {doctor_name}'s protocols
- Encourage patients to discuss specifics with their care team
- Never provide medical advice or fabricate information"""
            else:
                system_prompt = """You are a patient education assistant. Answer using ONLY the provided sources in clear language."""
        
        user_prompt = f"""Sources:
{context}

Question: {q}

Provide a helpful, accurate answer based solely on these sources."""

        # Use OpenAI
        oa = retrieval.openai_client()
        response = oa.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        answer_text = response.choices[0].message.content or "I couldn't generate an answer."

    latency_ms = int((time.time() - t0) * 1000)
    logger.info("rag_query", latency_ms=latency_ms, k=len(hits or []), collections=collections_to_search)
    return Answer(
        answer=answer_text, 
        citations=citations, 
        guardrails={"in_scope": True, "emergency": False}, 
        latency_ms=latency_ms
    )

@router.post("/dev/seed")
async def dev_seed():
    """Seed demo data."""
    retrieval.seed_demo()
    return {"status": "seeded"}

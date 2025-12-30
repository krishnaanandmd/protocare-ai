import os, tempfile, logging, uuid
from types import SimpleNamespace as NS
from typing import List, Dict, Any
import boto3
from botocore.config import Config as BotoConfig
from pypdf import PdfReader
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from openai import OpenAI
from app.core.config import settings

# OCR imports - check dynamically to avoid caching issues
def _check_ocr_available():
    try:
        import pytesseract
        from pdf2image import convert_from_path
        from PIL import Image
        print("✅ OCR libraries successfully imported in _check_ocr_available()")
        return True
    except ImportError as e:
        print(f"❌ OCR import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ OCR check unexpected error: {e}")
        return False

log = logging.getLogger("ingestion")
log.setLevel(logging.INFO)

STATUS: Dict[str, Dict[str, Any]] = {}
EMBED_MODEL = "text-embedding-3-small"
PRECEDENCE = {"AAOS":100, "RCT":100, "CLINICAL_GUIDELINE":100, "HOSPITAL_POLICY":90, "PEER_REVIEW":80, "DOCTOR_PROTOCOL":95, "OTHER":50}

def _s3():
    return boto3.client("s3", region_name=settings.aws_region, config=BotoConfig(retries={"max_attempts": 3}))

def _qdrant():
    kw = dict(url=settings.qdrant_url, timeout=90)
    if settings.qdrant_api_key: kw["api_key"] = settings.qdrant_api_key
    return QdrantClient(**kw)

def _openai(): 
    return OpenAI(api_key=settings.openai_api_key)

def _ensure_collection(cli: QdrantClient, collection_name: str):
    try: 
        cli.get_collection(collection_name)
    except Exception:
        cli.recreate_collection(
            collection_name=collection_name, 
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )

def _download(bucket: str, key: str) -> str:
    _s3().head_object(Bucket=bucket, Key=key)
    fd, path = tempfile.mkstemp(prefix="doc-", suffix=os.path.splitext(key)[1])
    os.close(fd)
    with open(path, "wb") as f: 
        _s3().download_fileobj(bucket, key, f)
    return path

def _ocr_pdf(path: str) -> List[NS]:
    """Extract text from scanned PDF using OCR."""
    if not _check_ocr_available():
        raise RuntimeError("OCR libraries not installed. Run: pip install pytesseract pdf2image pillow")
    
    # Import here to avoid issues if not installed
    import pytesseract
    from pdf2image import convert_from_path
    
    log.info("Running OCR on scanned PDF...")
    elements = []
    
    try:
        # Convert PDF to images
        images = convert_from_path(path, dpi=300)
        log.info(f"Processing {len(images)} pages with OCR...")
        
        for page_num, image in enumerate(images, start=1):
            # Extract text using Tesseract
            text = pytesseract.image_to_string(image)
            text = text.strip()
            
            if text:
                elements.append(NS(
                    text=text,
                    metadata=NS(page_number=page_num, category="ocr")
                ))
                log.info(f"OCR extracted {len(text)} chars from page {page_num}")
            else:
                log.warning(f"No text found on page {page_num}")
        
        return elements
    except Exception as e:
        log.error(f"OCR failed: {e}")
        raise RuntimeError(f"OCR processing failed: {str(e)}")

def _parse_pdf_fast(path: str) -> List[NS]:
    """Try normal extraction first, fall back to OCR if no text found."""
    r = PdfReader(path)
    out = []
    total_text_length = 0
    
    # Try extracting text normally
    for i, p in enumerate(r.pages):
        t = (p.extract_text() or "").strip()
        if t:
            out.append(NS(text=t, metadata=NS(page_number=i+1, category=None)))
            total_text_length += len(t)
    
    # If very little text extracted (likely scanned), use OCR
    if total_text_length < 100 and len(r.pages) > 0:
        print(f"⚠️  Only {total_text_length} chars extracted from {len(r.pages)} pages - PDF appears to be scanned")
        ocr_available = _check_ocr_available()
        print(f"🔍 OCR check result: {ocr_available}")
        
        if ocr_available:
            print("🚀 Starting OCR extraction...")
            result = _ocr_pdf(path)
            print(f"✅ OCR extracted {len(result)} elements")
            return result
        else:
            print("❌ OCR not available")
            raise RuntimeError("PDF appears to be scanned but OCR is not available. Install: pip install pytesseract pdf2image pillow")
    
    return out

def _split(text: str, max_chars=1800, overlap=200) -> List[str]:
    if not text: return []
    chunks = []
    i = 0
    L = len(text)
    while i < L:
        j = min(L, i+max_chars)
        cut = text.rfind(". ", i, j)
        cut = j if cut == -1 or cut < i+max_chars*0.6 else cut+1
        piece = text[i:cut].strip()
        if piece: 
            chunks.append(piece)
        i = max(cut-overlap, 0) if cut != j else j
    return chunks

def _to_chunks(elems: List[NS]) -> List[Dict[str, Any]]:
    out = []
    for el in elems:
        txt = (getattr(el,"text","") or "").strip()
        if not txt: continue
        page = getattr(getattr(el,"metadata",NS()),"page_number",None)
        for sub in _split(txt): 
            out.append({"text":sub,"page":page,"section":None})
    return out

def _embed(texts: List[str]) -> List[List[float]]:
    if not texts: return []
    cli = _openai()
    out = []
    B = 128
    for i in range(0, len(texts), B):
        resp = cli.embeddings.create(model=EMBED_MODEL, input=texts[i:i+B])
        out.extend([d.embedding for d in resp.data])
    return out

def process_document(s3_key: str, source_type: str = "OTHER", org_id: str = "demo"):
    bucket = settings.s3_bucket
    doc_id = s3_key
    
    # Extract collection name from org_id (which is dr_name_protocol format)
    collection_name = org_id if org_id.startswith("dr_") else settings.collection
    
    STATUS[doc_id] = {"state":"processing"}
    log.info("INGEST start %s", s3_key)
    try:
        path = _download(bucket, s3_key)
        log.info("Downloaded %s", path)
        
        elems = _parse_pdf_fast(path)
        
        if not elems: 
            raise RuntimeError("No text extracted. PDF may be scanned and OCR failed, or file is empty.")
        
        chunks = _to_chunks(elems)
        log.info("Chunks pre-embed=%d", len(chunks))
        
        vecs = _embed([c["text"] for c in chunks])
        if len(vecs) != len(chunks): 
            raise RuntimeError("Embedding mismatch")
        
        cli = _qdrant()
        _ensure_collection(cli, collection_name)
        
        rank = PRECEDENCE.get(source_type.upper(), PRECEDENCE["OTHER"])
        
        # Extract filename for title
        filename = os.path.basename(s3_key)
        
        points = []
        for i, (c, v) in enumerate(zip(chunks, vecs)):
            # Use UUID for point ID instead of string path (Qdrant requires UUID or int)
            pid = str(uuid.uuid4())
            payload = {
                "document_id": doc_id,
                "org_id": org_id,
                "source_type": source_type,
                "precedence": rank,
                "page": c.get("page"),
                "section": c.get("section"),
                "text": c["text"],
                "title": filename,
                "chunk_index": i  # Add chunk index to payload for reference
            }
            points.append(PointStruct(id=pid, vector=v, payload=payload))
        
        print(f"📤 Attempting to upsert {len(points)} points to {collection_name}")
        try:
            cli.upsert(collection_name=collection_name, points=points)
            print(f"✅ Successfully upserted {len(points)} points")
        except Exception as e:
            print(f"❌ Upsert failed: {type(e).__name__}: {e}")
            raise
        STATUS[doc_id] = {"state":"done","chunks":len(chunks),"vectors":len(vecs)}
        log.info("INGEST done %s chunks=%d", s3_key, len(chunks))
        
    except Exception as e:
        STATUS[doc_id] = {"state":"error","error":str(e)}
        log.exception("INGEST failed %s: %s", s3_key, e)
        raise
    finally:
        # Clean up temp file
        try:
            if 'path' in locals():
                os.unlink(path)
        except:
            pass

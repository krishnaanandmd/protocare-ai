from typing import Optional
from openai import OpenAI
import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.core.config import settings
from app.core.logging import logger

_client: Optional[QdrantClient] = None
_oa: Optional[OpenAI] = None

def client() -> QdrantClient:
    global _client
    if _client is None:
        try:
            # Simple initialization - let Qdrant client handle the details
            if settings.qdrant_api_key:
                _client = QdrantClient(
                    url=settings.qdrant_url,
                    api_key=settings.qdrant_api_key,
                    timeout=60,
                    prefer_grpc=False  # Use HTTP instead of gRPC to avoid connection issues
                )
            else:
                _client = QdrantClient(
                    url=settings.qdrant_url,
                    timeout=60,
                    prefer_grpc=False
                )
            logger.info("qdrant_client_initialized", url=settings.qdrant_url)
        except Exception as e:
            logger.error("qdrant_client_init_failed", error=str(e))
            raise
    return _client

def openai_client() -> OpenAI:
    global _oa
    if _oa is None:
        _oa = OpenAI(api_key=settings.openai_api_key)
    return _oa

def ensure_collection(collection_name: str = None):
    c = client()
    coll_name = collection_name or settings.collection
    try:
        c.get_collection(coll_name)
    except Exception:
        logger.info("creating_collection", name=coll_name)
        c.recreate_collection(
            collection_name=coll_name,
            vectors_config=qmodels.VectorParams(size=1536, distance=qmodels.Distance.COSINE),
        )

def embed(text: str) -> list[float]:
    """Return a single 1536-dim embedding using text-embedding-3-small."""
    oa = openai_client()
    out = oa.embeddings.create(model="text-embedding-3-small", input=text)
    return out.data[0].embedding

def search(question: str, top_k: int = 6, collection_name: str = None):
    vec = embed(question)
    c = client()
    coll_name = collection_name or settings.collection
    return c.search(
        collection_name=coll_name,
        query_vector=vec,
        limit=top_k,
        with_payload=True,
    )

# Dev-only seeder for testing
def seed_demo():
    ensure_collection()
    c = client()
    points = [
        qmodels.PointStruct(
            id=str(uuid.uuid4()),
            vector=embed("AAOS recommends risk stratification and VTE prophylaxis following TKA/THA."),
            payload={
                "title": "AAOS TKA/THA Guideline (demo)",
                "document_id": "aaos_demo",
                "page": 12,
                "section": "VTE prophylaxis",
                "source_type": "AAOS",
                "precedence_rank": 2,
                "text": "AAOS statement (demo): consider chemoprophylaxis based on risk."
            },
        ),
        qmodels.PointStruct(
            id=str(uuid.uuid4()),
            vector=embed("Hospital policy requires nasal decolonization pre-op for joint replacement."),
            payload={
                "title": "Hospital Policy 42 (demo)",
                "document_id": "policy_demo",
                "page": 2,
                "section": "Pre-op decolonization",
                "source_type": "HOSPITAL_POLICY",
                "precedence_rank": 1,
                "text": "Policy (demo): mupirocin + chlorhexidine wash protocol."
            },
        ),
    ]
    c.upsert(collection_name=settings.collection, points=points)
    logger.info("seed_demo_done", points=len(points))

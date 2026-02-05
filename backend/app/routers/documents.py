import re
import os
import logging
from typing import Optional, List
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import boto3
from botocore.config import Config as BotoConfig
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.services.s3_uploads import presign_post
from app.services.ingestion import (
    process_document,
    STATUS,
    _filename_to_title,
    _extract_metadata,
    _extract_docx_metadata,
)
from app.core.config import settings

log = logging.getLogger("documents")
router = APIRouter()


def _get_s3_client():
    return boto3.client("s3", region_name=settings.aws_region, config=BotoConfig(retries={"max_attempts": 3}))


def _get_qdrant_client() -> QdrantClient:
    kw = dict(url=settings.qdrant_url, timeout=90)
    if settings.qdrant_api_key:
        kw["api_key"] = settings.qdrant_api_key
    return QdrantClient(**kw)


def _is_uuid_filename(filename: str) -> bool:
    """Check if a filename looks like a UUID-based name (no meaningful title)."""
    if not filename:
        return True
    # Remove extension
    name = os.path.splitext(filename)[0]
    # Check if it's a hex string (typical UUID format) or very short meaningless name
    hex_pattern = r'^[a-f0-9]{8,}$'
    return bool(re.match(hex_pattern, name.lower())) or len(name) < 5

class UploadInitRequest(BaseModel):
    filename: str
    content_type: str = "application/pdf"
    org_id: str = "demo"

class UploadInitResponse(BaseModel):
    upload_url: str
    fields: dict
    key: str
    bucket: str
    document_id: str

@router.post("/upload:init", response_model=UploadInitResponse)
async def upload_init(body: UploadInitRequest):
    signed = presign_post(org_id=body.org_id, filename=body.filename, content_type=body.content_type)
    return UploadInitResponse(
        upload_url=signed["url"], 
        fields=signed["fields"], 
        key=signed["key"],
        bucket=signed["bucket"], 
        document_id=signed["key"]
    )

@router.post("/{document_id:path}/publish")
def publish(document_id: str, background: BackgroundTasks, source_type: str = "OTHER", org_id: str = "demo"):
    STATUS[document_id] = {"state": "queued"}
    background.add_task(process_document, document_id, source_type, org_id)
    return {"status": "queued", "document_id": document_id}

class IngestNowRequest(BaseModel):
    key: str
    source_type: str = "AAOS"
    org_id: str = "demo"

@router.post("/ingest_now")
def ingest_now_json(body: IngestNowRequest):
    STATUS[body.key] = {"state": "processing"}
    process_document(body.key, body.source_type, body.org_id)
    return STATUS[body.key]

@router.get("/{document_id:path}/status")
def status(document_id: str):
    return STATUS.get(document_id, {"state": "unknown"})

@router.get("/debug/statuses")
def all_statuses():
    return STATUS


class MigrateTitlesResponse(BaseModel):
    collections_processed: int
    documents_updated: int
    documents_skipped: int
    errors: List[str]


@router.post("/migrate/titles", response_model=MigrateTitlesResponse)
async def migrate_document_titles(dry_run: bool = True):
    """
    Migrate existing documents to have proper titles based on original filenames from S3 metadata.

    This endpoint:
    1. Scans all Qdrant collections for documents with UUID-like titles
    2. Fetches the original filename from S3 metadata
    3. Updates the title in Qdrant to a readable format

    Note: This only works for documents uploaded AFTER the original filename was stored in S3 metadata.
    For older documents, use /migrate/re-extract-titles instead.

    Args:
        dry_run: If True (default), only report what would be changed without making changes.
    """
    qdrant = _get_qdrant_client()
    s3 = _get_s3_client()

    collections_processed = 0
    documents_updated = 0
    documents_skipped = 0
    errors = []

    try:
        # Get all collections
        collections = qdrant.get_collections().collections
        collection_names = [col.name for col in collections]

        for collection_name in collection_names:
            collections_processed += 1
            log.info(f"Processing collection: {collection_name}")

            # Track document_ids -> list of point_ids for batch updates
            doc_to_points: dict[str, list] = {}

            # First pass: collect all points grouped by document_id
            offset = None
            while True:
                scroll_result = qdrant.scroll(
                    collection_name=collection_name,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
                points, offset = scroll_result

                if not points:
                    break

                for point in points:
                    payload = point.payload or {}
                    document_id = payload.get("document_id")
                    current_title = payload.get("title", "")

                    if not document_id:
                        continue

                    if document_id not in doc_to_points:
                        doc_to_points[document_id] = {
                            "point_ids": [],
                            "current_title": current_title
                        }
                    doc_to_points[document_id]["point_ids"].append(point.id)

                if offset is None:
                    break

            # Second pass: process each unique document
            for document_id, doc_info in doc_to_points.items():
                current_title = doc_info["current_title"]
                point_ids = doc_info["point_ids"]

                # Check if title looks like UUID filename
                if not _is_uuid_filename(current_title):
                    documents_skipped += 1
                    continue

                # Try to get original filename from S3 metadata
                try:
                    head_resp = s3.head_object(Bucket=settings.s3_bucket, Key=document_id)
                    original_filename = head_resp.get('Metadata', {}).get('original-filename')

                    if not original_filename:
                        log.info(f"No original filename in S3 metadata for {document_id}")
                        documents_skipped += 1
                        continue

                    new_title = _filename_to_title(original_filename)

                    if new_title and new_title != current_title:
                        log.info(f"Would update '{current_title}' -> '{new_title}' for {document_id}")

                        if not dry_run:
                            # Batch update all points for this document
                            qdrant.set_payload(
                                collection_name=collection_name,
                                payload={"title": new_title, "original_filename": original_filename},
                                points=point_ids,
                            )

                        documents_updated += 1
                    else:
                        documents_skipped += 1

                except Exception as e:
                    error_msg = f"Error processing {document_id}: {str(e)}"
                    log.error(error_msg)
                    errors.append(error_msg)

    except Exception as e:
        error_msg = f"Migration failed: {str(e)}"
        log.error(error_msg)
        errors.append(error_msg)

    return MigrateTitlesResponse(
        collections_processed=collections_processed,
        documents_updated=documents_updated,
        documents_skipped=documents_skipped,
        errors=errors,
    )


@router.get("/collections/{collection_name}/documents")
async def list_collection_documents(collection_name: str, limit: int = 50):
    """
    List unique documents in a collection with their titles.
    Useful for debugging/inspecting document titles.
    """
    qdrant = _get_qdrant_client()

    try:
        documents = {}
        offset = None

        while len(documents) < limit:
            scroll_result = qdrant.scroll(
                collection_name=collection_name,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            points, offset = scroll_result

            if not points:
                break

            for point in points:
                payload = point.payload or {}
                doc_id = payload.get("document_id")
                if doc_id and doc_id not in documents:
                    documents[doc_id] = {
                        "document_id": doc_id,
                        "title": payload.get("title"),
                        "original_filename": payload.get("original_filename"),
                        "author": payload.get("author"),
                        "publication_year": payload.get("publication_year"),
                        "source_type": payload.get("source_type"),
                    }
                    if len(documents) >= limit:
                        break

            if offset is None:
                break

        return {
            "collection": collection_name,
            "document_count": len(documents),
            "documents": list(documents.values())
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")


class UpdateTitleRequest(BaseModel):
    collection_name: str
    document_id: str
    new_title: str


@router.post("/update-title")
async def update_document_title(body: UpdateTitleRequest):
    """
    Manually update a document's title in Qdrant.
    This updates all chunks belonging to the document.
    """
    qdrant = _get_qdrant_client()

    try:
        # Find all points with this document_id by scrolling (no filter to avoid index requirement)
        point_ids = []
        offset = None

        while True:
            scroll_result = qdrant.scroll(
                collection_name=body.collection_name,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )
            points, offset = scroll_result

            if not points:
                break

            for point in points:
                payload = point.payload or {}
                if payload.get("document_id") == body.document_id:
                    point_ids.append(point.id)

            if offset is None:
                break

        if not point_ids:
            raise HTTPException(status_code=404, detail=f"Document not found: {body.document_id}")

        # Update title for all points
        qdrant.set_payload(
            collection_name=body.collection_name,
            payload={"title": body.new_title},
            points=point_ids,
        )

        return {
            "status": "success",
            "document_id": body.document_id,
            "new_title": body.new_title,
            "chunks_updated": len(point_ids)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update title: {str(e)}")


class ReExtractMigrationResponse(BaseModel):
    collections_processed: int
    documents_processed: int
    documents_updated: int
    documents_failed: int
    updates: List[dict]
    errors: List[str]


@router.post("/migrate/re-extract-titles", response_model=ReExtractMigrationResponse)
async def migrate_reextract_titles(
    collection_name: Optional[str] = None,
    dry_run: bool = True
):
    """
    Re-extract titles from actual document files for existing documents.

    This endpoint:
    1. Scans collections for documents with UUID-like titles
    2. Downloads the actual file from S3
    3. Re-extracts metadata (title, author, year) from the document
    4. Updates Qdrant with the extracted title

    Args:
        collection_name: Optional specific collection to process. If None, processes all.
        dry_run: If True (default), only report what would be changed.
    """
    import tempfile

    qdrant = _get_qdrant_client()
    s3 = _get_s3_client()

    collections_processed = 0
    documents_processed = 0
    documents_updated = 0
    documents_failed = 0
    updates = []
    errors = []

    try:
        # Get collections to process
        if collection_name:
            collection_names = [collection_name]
        else:
            collections = qdrant.get_collections().collections
            collection_names = [col.name for col in collections]

        for coll_name in collection_names:
            collections_processed += 1
            log.info(f"Processing collection: {coll_name}")

            # Track document_ids -> list of point_ids for batch updates
            doc_to_points: dict[str, list] = {}

            # First pass: collect all points grouped by document_id
            offset = None
            while True:
                scroll_result = qdrant.scroll(
                    collection_name=coll_name,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
                points, offset = scroll_result

                if not points:
                    break

                for point in points:
                    payload = point.payload or {}
                    document_id = payload.get("document_id")
                    current_title = payload.get("title", "")

                    if not document_id:
                        continue

                    # Initialize or append to the list of points for this document
                    if document_id not in doc_to_points:
                        doc_to_points[document_id] = {
                            "point_ids": [],
                            "current_title": current_title
                        }
                    doc_to_points[document_id]["point_ids"].append(point.id)

                if offset is None:
                    break

            # Second pass: process each unique document
            for document_id, doc_info in doc_to_points.items():
                current_title = doc_info["current_title"]
                point_ids = doc_info["point_ids"]
                documents_processed += 1

                # Check if title needs updating (UUID-like or "Unknown")
                if not _is_uuid_filename(current_title) and current_title not in ["Unknown", "Unknown Document"]:
                    continue

                try:
                    # Download file from S3
                    file_ext = os.path.splitext(document_id)[1].lower()
                    fd, temp_path = tempfile.mkstemp(suffix=file_ext)
                    os.close(fd)

                    try:
                        with open(temp_path, "wb") as f:
                            s3.download_fileobj(settings.s3_bucket, document_id, f)

                        # Extract metadata based on file type
                        if file_ext in ['.docx', '.doc']:
                            doc_title, doc_author, doc_year = _extract_docx_metadata(temp_path)
                        else:
                            doc_title, doc_author, doc_year = _extract_metadata(temp_path)

                        # Check S3 metadata for original filename as fallback
                        if not doc_title:
                            try:
                                head_resp = s3.head_object(Bucket=settings.s3_bucket, Key=document_id)
                                original_filename = head_resp.get('Metadata', {}).get('original-filename')
                                if original_filename:
                                    doc_title = _filename_to_title(original_filename)
                            except Exception:
                                pass

                        if doc_title and doc_title != current_title:
                            update_info = {
                                "document_id": document_id,
                                "old_title": current_title,
                                "new_title": doc_title,
                                "author": doc_author,
                                "year": doc_year,
                                "chunks": len(point_ids),
                            }
                            updates.append(update_info)
                            log.info(f"Would update: {current_title} -> {doc_title} ({len(point_ids)} chunks)")

                            if not dry_run:
                                # Update payload for all points at once
                                update_payload = {"title": doc_title}
                                if doc_author:
                                    update_payload["author"] = doc_author
                                if doc_year:
                                    update_payload["publication_year"] = doc_year

                                # Batch update all points for this document
                                qdrant.set_payload(
                                    collection_name=coll_name,
                                    payload=update_payload,
                                    points=point_ids,
                                )

                            documents_updated += 1

                    finally:
                        # Clean up temp file
                        try:
                            os.unlink(temp_path)
                        except:
                            pass

                except Exception as e:
                    error_msg = f"Error processing {document_id}: {str(e)}"
                    log.error(error_msg)
                    errors.append(error_msg)
                    documents_failed += 1

    except Exception as e:
        error_msg = f"Migration failed: {str(e)}"
        log.error(error_msg)
        errors.append(error_msg)

    return ReExtractMigrationResponse(
        collections_processed=collections_processed,
        documents_processed=documents_processed,
        documents_updated=documents_updated,
        documents_failed=documents_failed,
        updates=updates,
        errors=errors,
    )

#!/usr/bin/env python3
"""
Migration script to add author and publication_year metadata to existing documents in Qdrant.

This script:
1. Scans all collections in Qdrant
2. Identifies unique documents (by document_id)
3. Downloads PDFs from S3 and extracts metadata
4. Updates all chunks for each document with the new metadata fields

Usage:
    python -m app.scripts.migrate_citation_metadata [--dry-run] [--collection COLLECTION_NAME]
"""

import os
import sys
import argparse
import tempfile
import logging
from collections import defaultdict
from typing import Dict, Set, Tuple, Optional

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import boto3
from botocore.config import Config as BotoConfig
from qdrant_client import QdrantClient
from app.core.config import settings
from app.services.ingestion import _extract_metadata

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
log = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client("s3", region_name=settings.aws_region, config=BotoConfig(retries={"max_attempts": 3}))


def get_qdrant_client():
    kw = dict(url=settings.qdrant_url, timeout=90)
    if settings.qdrant_api_key:
        kw["api_key"] = settings.qdrant_api_key
    return QdrantClient(**kw)


def download_pdf(bucket: str, key: str) -> str:
    """Download PDF from S3 to temporary file."""
    s3 = get_s3_client()
    fd, path = tempfile.mkstemp(prefix="migrate-", suffix=".pdf")
    os.close(fd)

    try:
        s3.head_object(Bucket=bucket, Key=key)
        with open(path, "wb") as f:
            s3.download_fileobj(bucket, key, f)
        return path
    except Exception as e:
        log.error(f"Failed to download {key}: {e}")
        os.unlink(path)
        raise


def process_document(bucket: str, document_id: str, point_ids: list) -> Tuple[Optional[str], Optional[str], Optional[int]]:
    """
    Download PDF and extract metadata.
    Returns: (title, author, publication_year)
    """
    path = None
    try:
        log.info(f"Processing document: {document_id}")
        path = download_pdf(bucket, document_id)

        title, author, year = _extract_metadata(path)

        # Fallback to filename if no title
        if not title:
            title = os.path.basename(document_id)

        log.info(f"Extracted - Title: {title}, Author: {author}, Year: {year}")
        return (title, author, year)

    except Exception as e:
        log.error(f"Failed to process {document_id}: {e}")
        return (None, None, None)
    finally:
        if path and os.path.exists(path):
            try:
                os.unlink(path)
            except:
                pass


def migrate_collection(client: QdrantClient, collection_name: str, bucket: str, dry_run: bool = False):
    """
    Migrate all documents in a collection.
    """
    log.info(f"Starting migration for collection: {collection_name}")

    # Group points by document_id
    document_points: Dict[str, list] = defaultdict(list)
    processed_docs: Set[str] = set()

    # Scroll through all points in the collection
    log.info("Scanning collection for documents...")
    offset = None
    total_points = 0

    while True:
        results = client.scroll(
            collection_name=collection_name,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False
        )

        points, next_offset = results

        if not points:
            break

        for point in points:
            total_points += 1
            if point.payload and 'document_id' in point.payload:
                doc_id = point.payload['document_id']
                document_points[doc_id].append(point.id)

        offset = next_offset
        if offset is None:
            break

    log.info(f"Found {len(document_points)} unique documents across {total_points} points")

    # Process each document
    success_count = 0
    error_count = 0
    skipped_count = 0

    for doc_id, point_ids in document_points.items():
        try:
            # Check if document already has metadata
            sample_point = client.retrieve(collection_name=collection_name, ids=[point_ids[0]])[0]
            if sample_point.payload.get('author') or sample_point.payload.get('publication_year'):
                log.info(f"Skipping {doc_id} - already has metadata")
                skipped_count += 1
                continue

            # Extract metadata
            title, author, year = process_document(bucket, doc_id, point_ids)

            if dry_run:
                log.info(f"[DRY RUN] Would update {len(point_ids)} points for {doc_id}")
                log.info(f"[DRY RUN] Metadata: title={title}, author={author}, year={year}")
                success_count += 1
                continue

            # Update all points for this document
            log.info(f"Updating {len(point_ids)} points for {doc_id}")

            for point_id in point_ids:
                # Retrieve current point
                points = client.retrieve(collection_name=collection_name, ids=[point_id])
                if not points:
                    continue

                point = points[0]
                payload = dict(point.payload) if point.payload else {}

                # Update with new metadata
                if title:
                    payload['title'] = title
                if author:
                    payload['author'] = author
                if year:
                    payload['publication_year'] = year

                # Update point with new payload
                client.set_payload(
                    collection_name=collection_name,
                    payload=payload,
                    points=[point_id]
                )

            log.info(f"✓ Successfully updated {len(point_ids)} points for {doc_id}")
            success_count += 1

        except Exception as e:
            log.error(f"✗ Failed to migrate {doc_id}: {e}")
            error_count += 1

    log.info(f"\nMigration complete for {collection_name}:")
    log.info(f"  Success: {success_count}")
    log.info(f"  Errors: {error_count}")
    log.info(f"  Skipped: {skipped_count}")

    return success_count, error_count, skipped_count


def main():
    parser = argparse.ArgumentParser(description='Migrate citation metadata in Qdrant')
    parser.add_argument('--dry-run', action='store_true', help='Run without making changes')
    parser.add_argument('--collection', type=str, help='Migrate specific collection only')
    args = parser.parse_args()

    log.info("Starting citation metadata migration")
    log.info(f"Qdrant URL: {settings.qdrant_url}")
    log.info(f"S3 Bucket: {settings.s3_bucket}")
    log.info(f"Dry run: {args.dry_run}")

    client = get_qdrant_client()
    bucket = settings.s3_bucket

    # Get all collections
    if args.collection:
        collections = [args.collection]
    else:
        collections_response = client.get_collections()
        collections = [c.name for c in collections_response.collections]

    log.info(f"Found {len(collections)} collection(s) to migrate")

    total_success = 0
    total_errors = 0
    total_skipped = 0

    for collection in collections:
        log.info(f"\n{'='*60}")
        log.info(f"Processing collection: {collection}")
        log.info(f"{'='*60}")

        try:
            success, errors, skipped = migrate_collection(client, collection, bucket, args.dry_run)
            total_success += success
            total_errors += errors
            total_skipped += skipped
        except Exception as e:
            log.error(f"Failed to process collection {collection}: {e}")
            total_errors += 1

    log.info(f"\n{'='*60}")
    log.info("FINAL SUMMARY")
    log.info(f"{'='*60}")
    log.info(f"Total documents updated: {total_success}")
    log.info(f"Total errors: {total_errors}")
    log.info(f"Total skipped: {total_skipped}")

    if args.dry_run:
        log.info("\nThis was a dry run. No changes were made.")
        log.info("Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()

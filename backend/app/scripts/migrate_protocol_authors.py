#!/usr/bin/env python3
"""
Migration script to set the author field on doctor protocol documents.

For doctor-specific collections (e.g. dr_joshua_dines_clinic_protocols),
non-research documents should list the doctor as the author — not whatever
metadata was embedded in the PDF (often the typist or blank).

Research source types (AAOS, RCT, CLINICAL_GUIDELINE, PEER_REVIEW) are
intentionally skipped so their extracted paper authors remain intact.

Usage:
    python -m app.scripts.migrate_protocol_authors [--dry-run] [--collection COLLECTION_NAME]
"""

import os
import sys
import argparse
import logging
from collections import defaultdict
from typing import Dict, Set

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from qdrant_client import QdrantClient
from app.core.config import settings
from app.services.ingestion import DOCTOR_SLUG_TO_NAME, _RESEARCH_SOURCE_TYPES

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
log = logging.getLogger(__name__)


def get_qdrant_client():
    kw = dict(url=settings.qdrant_url, timeout=90)
    if settings.qdrant_api_key:
        kw["api_key"] = settings.qdrant_api_key
    return QdrantClient(**kw)


def doctor_name_for_collection(collection_name: str) -> str | None:
    """Return the doctor display name if the collection is doctor-specific."""
    if not collection_name.startswith("dr_") or collection_name.startswith("dr_general_"):
        return None
    for slug, name in DOCTOR_SLUG_TO_NAME.items():
        if collection_name.startswith(f"dr_{slug}_"):
            return name
    return None


def migrate_collection(client: QdrantClient, collection_name: str, dry_run: bool = False):
    """Set the author to the doctor's name on all non-research points."""
    doctor_name = doctor_name_for_collection(collection_name)
    if not doctor_name:
        log.info(f"Skipping {collection_name} — not a doctor-specific collection")
        return 0, 0, 0

    log.info(f"Migrating {collection_name} → author = '{doctor_name}'")

    offset = None
    updated = 0
    skipped = 0
    errors = 0

    while True:
        results = client.scroll(
            collection_name=collection_name,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        points, next_offset = results
        if not points:
            break

        for point in points:
            payload = point.payload or {}
            source_type = (payload.get("source_type") or "OTHER").upper()

            # Skip research articles — keep their extracted author
            if source_type in _RESEARCH_SOURCE_TYPES:
                skipped += 1
                continue

            # Skip if already correct
            if payload.get("author") == doctor_name:
                skipped += 1
                continue

            old_author = payload.get("author")

            if dry_run:
                log.info(
                    f"  [DRY RUN] point {point.id}: "
                    f"author '{old_author}' → '{doctor_name}'"
                )
                updated += 1
                continue

            try:
                client.set_payload(
                    collection_name=collection_name,
                    payload={"author": doctor_name},
                    points=[point.id],
                )
                updated += 1
            except Exception as e:
                log.error(f"  Failed to update point {point.id}: {e}")
                errors += 1

        offset = next_offset
        if offset is None:
            break

    log.info(f"  Updated: {updated}, Skipped: {skipped}, Errors: {errors}")
    return updated, errors, skipped


def main():
    parser = argparse.ArgumentParser(
        description="Set author to the doctor's name on protocol documents in Qdrant"
    )
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without writing')
    parser.add_argument('--collection', type=str, help='Migrate a single collection')
    args = parser.parse_args()

    log.info("Protocol author migration")
    log.info(f"  Qdrant: {settings.qdrant_url}")
    log.info(f"  Dry run: {args.dry_run}")

    client = get_qdrant_client()

    if args.collection:
        collections = [args.collection]
    else:
        collections = [
            c.name for c in client.get_collections().collections
        ]

    total_updated = 0
    total_errors = 0
    total_skipped = 0

    for collection in sorted(collections):
        success, errors, skipped = migrate_collection(client, collection, args.dry_run)
        total_updated += success
        total_errors += errors
        total_skipped += skipped

    log.info(f"\nSummary: {total_updated} updated, {total_errors} errors, {total_skipped} skipped")
    if args.dry_run:
        log.info("This was a dry run. Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()

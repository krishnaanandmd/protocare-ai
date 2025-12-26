#!/usr/bin/env python3
"""
Script to list all Qdrant collections and their document counts.
Usage: python list_collections.py
"""

import sys
from pathlib import Path

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from qdrant_client import QdrantClient

def main():
    try:
        # Connect to Qdrant
        print(f"Connecting to Qdrant at: {settings.qdrant_url}\n")
        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key if hasattr(settings, 'qdrant_api_key') and settings.qdrant_api_key else None
        )

        # Get all collections
        collections = client.get_collections()

        print('=== QDRANT COLLECTIONS AND DOCUMENT COUNTS ===\n')

        if not collections.collections:
            print('No collections found.')
            return

        # Sort collections by name
        sorted_collections = sorted(collections.collections, key=lambda x: x.name)

        # Group collections by doctor
        doctor_collections = {}
        other_collections = []

        for collection in sorted_collections:
            # Get collection info to get point count
            info = client.get_collection(collection.name)
            point_count = info.points_count

            # Parse collection name
            if collection.name.startswith('dr_'):
                # Extract doctor name (everything between dr_ and the last _)
                parts = collection.name.split('_')
                if len(parts) >= 3:
                    doctor_key = '_'.join(parts[1:-1])  # Everything between dr_ and last _
                    procedure = parts[-1]

                    if doctor_key not in doctor_collections:
                        doctor_collections[doctor_key] = []

                    doctor_collections[doctor_key].append({
                        'collection': collection.name,
                        'procedure': procedure,
                        'count': point_count
                    })
                else:
                    other_collections.append({
                        'collection': collection.name,
                        'count': point_count
                    })
            else:
                other_collections.append({
                    'collection': collection.name,
                    'count': point_count
                })

        # Print by doctor
        total_docs = 0
        for doctor_key in sorted(doctor_collections.keys()):
            # Convert doctor key to readable name
            doctor_name = doctor_key.replace('_', ' ').title()
            print(f'Dr. {doctor_name}:')

            doctor_total = 0
            for item in sorted(doctor_collections[doctor_key], key=lambda x: x['procedure']):
                print(f'  {item["collection"]}: {item["count"]:,} documents')
                doctor_total += item['count']
                total_docs += item['count']

            print(f'  → Subtotal: {doctor_total:,} documents')
            print()

        # Print other collections
        if other_collections:
            print('Other Collections:')
            for item in other_collections:
                print(f'  {item["collection"]}: {item["count"]:,} documents')
                total_docs += item['count']
            print()

        print(f'=== TOTAL: {total_docs:,} documents across {len(sorted_collections)} collections ===')

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

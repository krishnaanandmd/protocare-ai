#!/usr/bin/env python3
"""
Batch upload script to process multiple PDF documents for doctor-specific protocols.
Usage: python batch_upload_docs.py --doctor "Joshua Dines" --protocol "UCL" --directory /path/to/pdfs/
"""

import argparse
import os
import sys
from pathlib import Path
import time
from typing import List

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent))

# Import the single document upload logic
from upload_docs import upload_to_s3, slugify, process_document

def find_pdf_files(directory: str) -> List[str]:
    """Find all PDF files in the given directory."""
    pdf_files = []
    directory_path = Path(directory)

    if not directory_path.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")

    # Find all PDF files recursively
    for pdf_file in directory_path.rglob("*.pdf"):
        if pdf_file.is_file():
            pdf_files.append(str(pdf_file))

    # Also check for uppercase extension
    for pdf_file in directory_path.rglob("*.PDF"):
        if pdf_file.is_file():
            pdf_files.append(str(pdf_file))

    return sorted(pdf_files)

def main():
    parser = argparse.ArgumentParser(
        description="Batch upload multiple PDF documents for doctor-specific protocols"
    )
    parser.add_argument(
        "--doctor",
        required=True,
        help="Doctor name (e.g., 'Joshua Dines')"
    )
    parser.add_argument(
        "--protocol",
        required=True,
        help="Protocol type (e.g., 'UCL', 'ACL') - internal classification"
    )
    parser.add_argument(
        "--directory",
        required=True,
        help="Path to directory containing PDF files"
    )
    parser.add_argument(
        "--source-type",
        default="DOCTOR_PROTOCOL",
        help="Source type classification"
    )
    parser.add_argument(
        "--skip-errors",
        action="store_true",
        help="Continue processing even if individual files fail"
    )

    args = parser.parse_args()

    doctor_slug = slugify(args.doctor)
    protocol_slug = slugify(args.protocol)
    org_id = f"dr_{doctor_slug}_{protocol_slug}"

    print("=" * 80)
    print("📦 BATCH DOCUMENT UPLOAD")
    print("=" * 80)
    print(f"🏥 Doctor: {args.doctor}")
    print(f"📋 Protocol: {args.protocol} (internal classification)")
    print(f"📁 Directory: {args.directory}")
    print(f"🏷️  Collection: {org_id}")
    print(f"📝 Source Type: {args.source_type}")
    print("=" * 80)
    print()

    try:
        # Find all PDF files
        print("🔍 Scanning for PDF files...")
        pdf_files = find_pdf_files(args.directory)

        if not pdf_files:
            print(f"❌ No PDF files found in {args.directory}")
            sys.exit(1)

        print(f"✅ Found {len(pdf_files)} PDF files\n")

        # Process each file
        successful = 0
        failed = 0
        skipped = 0
        errors = []

        for idx, pdf_path in enumerate(pdf_files, start=1):
            file_name = Path(pdf_path).name
            print("-" * 80)
            print(f"[{idx}/{len(pdf_files)}] Processing: {file_name}")
            print("-" * 80)

            try:
                # Upload to S3
                s3_key = upload_to_s3(pdf_path, doctor_slug, protocol_slug)

                # Process document (parse, chunk, embed, store)
                print(f"⚙️  Processing document...")
                process_document(s3_key, args.source_type, org_id)

                print(f"✅ SUCCESS: {file_name}")
                successful += 1

            except Exception as e:
                error_msg = f"Failed to process {file_name}: {str(e)}"
                print(f"❌ ERROR: {error_msg}")
                errors.append(error_msg)
                failed += 1

                if not args.skip_errors:
                    print("\n⚠️  Stopping due to error. Use --skip-errors to continue on failures.")
                    break

            print()

            # Small delay to avoid rate limiting
            if idx < len(pdf_files):
                time.sleep(0.5)

        # Summary
        print("=" * 80)
        print("📊 BATCH UPLOAD SUMMARY")
        print("=" * 80)
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"⏭️  Skipped: {len(pdf_files) - successful - failed}")
        print(f"📁 Total files: {len(pdf_files)}")
        print(f"🏷️  Collection: {org_id}")
        print("=" * 80)

        if errors:
            print("\n❌ ERRORS:")
            for error in errors:
                print(f"  - {error}")
            print()

        if failed > 0:
            sys.exit(1)

        print("\n🎉 All documents processed successfully!")

    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

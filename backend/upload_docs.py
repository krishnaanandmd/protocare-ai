#!/usr/bin/env python3
"""
Admin script to upload documents for doctor-specific protocols.
Usage: python upload_docs.py --doctor "Joshua Dines" --protocol "UCL" --file path/to/doc.pdf
"""

import argparse
import os
import sys
import uuid
from pathlib import Path
import boto3
from dotenv import load_dotenv

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent))
from app.services.ingestion import process_document
from app.core.config import settings

load_dotenv()

def slugify(text):
    """Convert text to slug format."""
    return text.lower().replace(" ", "_").replace(".", "")

def upload_to_s3(file_path, doctor_slug, protocol_slug):
    """Upload file to S3 and return the key."""
    s3 = boto3.client('s3', region_name=settings.aws_region)
    
    file_name = Path(file_path).name
    ext = Path(file_path).suffix
    unique_id = uuid.uuid4().hex[:12]
    
    # Organized S3 structure: uploads/doctors/{doctor}/{protocol}/{uuid}.pdf
    s3_key = f"uploads/doctors/{doctor_slug}/{protocol_slug}/{unique_id}{ext}"
    
    print(f"📤 Uploading {file_name} to S3...")
    with open(file_path, 'rb') as f:
        s3.upload_fileobj(f, settings.s3_bucket, s3_key)
    
    print(f"✅ Uploaded to: s3://{settings.s3_bucket}/{s3_key}")
    return s3_key

def main():
    parser = argparse.ArgumentParser(description="Upload documents for doctor-specific protocols")
    parser.add_argument("--doctor", required=True, help="Doctor name (e.g., 'Joshua Dines')")
    parser.add_argument("--protocol", required=True, help="Protocol type (e.g., 'UCL', 'ACL') - internal classification")
    parser.add_argument("--file", required=True, help="Path to PDF file")
    parser.add_argument("--source-type", default="DOCTOR_PROTOCOL", help="Source type classification")
    
    args = parser.parse_args()
    
    # Validate file exists
    if not os.path.exists(args.file):
        print(f"❌ Error: File not found: {args.file}")
        sys.exit(1)
    
    doctor_slug = slugify(args.doctor)
    protocol_slug = slugify(args.protocol)
    
    print(f"\n🏥 Doctor: {args.doctor}")
    print(f"📋 Protocol: {args.protocol} (internal classification)")
    print(f"📄 File: {args.file}")
    print(f"🏷️  Collection: dr_{doctor_slug}_{protocol_slug}\n")
    
    try:
        # Upload to S3
        s3_key = upload_to_s3(args.file, doctor_slug, protocol_slug)
        
        # Process document (parse, chunk, embed, store)
        print(f"\n⚙️  Processing document...")
        org_id = f"dr_{doctor_slug}_{protocol_slug}"
        process_document(s3_key, args.source_type, org_id)
        
        print(f"\n✅ SUCCESS! Document processed and ready for queries.")
        print(f"📊 Collection: {org_id}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

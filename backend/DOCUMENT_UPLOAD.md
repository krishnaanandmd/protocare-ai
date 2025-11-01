# Document Upload Guide

This guide explains how to upload medical protocol documents (PDFs) to the ProtoCare AI system.

## Overview

The system stores documents in AWS S3 and processes them for AI-powered retrieval. Documents are:
- Uploaded to S3 in an organized structure
- Parsed and chunked for optimal retrieval
- Embedded using OpenAI embeddings
- Stored in Qdrant vector database for semantic search

## Prerequisites

1. **Python Environment**: Ensure all dependencies are installed
   ```bash
   pip install -r requirements.txt
   ```

2. **AWS Credentials**: Configure your `.env` file with:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=your_region
   S3_BUCKET=your_bucket
   ```

3. **OpenAI API Key**: Add to `.env`:
   ```
   OPENAI_API_KEY=your_key
   ```

4. **Qdrant Configuration**: Add to `.env`:
   ```
   QDRANT_URL=your_qdrant_url
   QDRANT_API_KEY=your_api_key  # Optional
   ```

## Single Document Upload

Use `upload_docs.py` to upload a single PDF:

```bash
python upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --file /path/to/document.pdf
```

### Parameters:
- `--doctor`: Doctor name (e.g., "Joshua Dines")
- `--protocol`: Protocol type (e.g., "UCL", "ACL", "MCL")
- `--file`: Path to the PDF file
- `--source-type`: (Optional) Source classification (default: "DOCTOR_PROTOCOL")

### Example:
```bash
python upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --file ~/Downloads/ucl_protocol_phase1.pdf
```

## Batch Document Upload

Use `batch_upload_docs.py` to upload multiple PDFs from a directory:

```bash
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory /path/to/pdfs/
```

### Parameters:
- `--doctor`: Doctor name (e.g., "Joshua Dines")
- `--protocol`: Protocol type (e.g., "UCL", "ACL", "MCL")
- `--directory`: Path to directory containing PDF files
- `--source-type`: (Optional) Source classification (default: "DOCTOR_PROTOCOL")
- `--skip-errors`: (Optional) Continue processing even if individual files fail

### Example:
```bash
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory ~/Downloads/joshua_dines_ucl_protocols/
```

### Features:
- Recursively scans directory for all PDF files
- Processes each file sequentially
- Shows progress for each file
- Provides detailed summary at completion
- Can skip errors and continue processing

## How It Works

### 1. File Organization
Documents are stored in S3 with this structure:
```
s3://your-bucket/uploads/doctors/{doctor_slug}/{protocol_slug}/{uuid}.pdf
```

Example:
```
s3://protocare-docs/uploads/doctors/joshua_dines/ucl/a1b2c3d4e5f6.pdf
```

### 2. Vector Database Collections
Each doctor-protocol combination gets its own Qdrant collection:
```
dr_{doctor_slug}_{protocol_slug}
```

Example:
```
dr_joshua_dines_ucl
```

### 3. Document Processing Pipeline
1. **Upload**: File uploaded to S3 with unique ID
2. **Parse**: PDF text extracted (with OCR fallback for scanned documents)
3. **Chunk**: Text split into semantic chunks (~1800 chars with 200 char overlap)
4. **Embed**: Chunks embedded using OpenAI's text-embedding-3-small
5. **Store**: Vectors and metadata stored in Qdrant

### 4. Metadata
Each chunk includes:
- `document_id`: S3 key
- `org_id`: Collection identifier (e.g., "dr_joshua_dines_ucl")
- `source_type`: Classification (e.g., "DOCTOR_PROTOCOL")
- `precedence`: Priority ranking (DOCTOR_PROTOCOL = 95)
- `page`: Source page number
- `text`: Chunk content
- `title`: Original filename
- `chunk_index`: Position in document

## Source Type Precedence

Documents are ranked by source type for retrieval:
- `AAOS` (American Academy of Orthopaedic Surgeons): 100
- `DOCTOR_PROTOCOL`: 95
- `HOSPITAL_POLICY`: 90
- `PEER_REVIEW`: 80
- `OTHER`: 50

## Troubleshooting

### "PDF appears to be scanned but OCR is not available"
Install OCR dependencies:
```bash
pip install pytesseract pdf2image pillow
```

Also install Tesseract OCR:
- **macOS**: `brew install tesseract`
- **Ubuntu/Debian**: `apt-get install tesseract-ocr`
- **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki

### "No text extracted"
The PDF might be:
- Empty or corrupted
- Image-based without OCR support
- Password protected

### AWS Credentials Error
Verify your `.env` file has correct AWS credentials and the S3 bucket exists.

### Qdrant Connection Error
Check your `QDRANT_URL` and ensure the Qdrant instance is running and accessible.

## Example: Uploading 81 Joshua Dines UCL PDFs

If you have a folder with 81 PDFs at `/Users/akris/Downloads/drive-download-20251101T211111Z-1-001`:

```bash
cd backend
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory /Users/akris/Downloads/drive-download-20251101T211111Z-1-001 \
  --skip-errors
```

This will:
1. Find all 81 PDF files in the directory
2. Upload each to S3 under `uploads/doctors/joshua_dines/ucl/`
3. Process each document through the AI pipeline
4. Store all chunks in the `dr_joshua_dines_ucl` collection
5. Show progress and a final summary

Expected output:
```
📦 BATCH DOCUMENT UPLOAD
🏥 Doctor: Joshua Dines
📋 Protocol: UCL (internal classification)
📁 Directory: /Users/akris/Downloads/drive-download-20251101T211111Z-1-001
🏷️  Collection: dr_joshua_dines_ucl
✅ Found 81 PDF files

[1/81] Processing: protocol_week1.pdf
✅ SUCCESS: protocol_week1.pdf
...
[81/81] Processing: protocol_week24.pdf
✅ SUCCESS: protocol_week24.pdf

📊 BATCH UPLOAD SUMMARY
✅ Successful: 81
❌ Failed: 0
📁 Total files: 81
🏷️  Collection: dr_joshua_dines_ucl

🎉 All documents processed successfully!
```

## Query Usage

Once uploaded, documents can be queried via the API:

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What exercises are recommended for week 3 of UCL rehab?",
    "org_id": "dr_joshua_dines_ucl"
  }'
```

The system will:
1. Embed the question
2. Search the `dr_joshua_dines_ucl` collection
3. Retrieve the most relevant chunks
4. Generate an AI-powered response with citations

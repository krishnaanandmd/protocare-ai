# Quick Start: Upload Initial Documents

## Overview

This guide walks through uploading the first batch of 7 document sets from `/Users/akris/Downloads/`.

## Document Sets to Upload

| Folder Name | Source Type | Collection Name |
|-------------|-------------|-----------------|
| `UCL RCT` | RCT | `dr_general_ucl_rct` |
| `RotatorCuff RCT` | RCT | `dr_general_rotator_cuff_rct` |
| `ACL RCT` | RCT | `dr_general_acl_rct` |
| `Meniscus RCT` | RCT | `dr_general_meniscus_rct` |
| `Back` | CLINICAL_GUIDELINE | `dr_general_back` |
| `Neck` | CLINICAL_GUIDELINE | `dr_general_neck` |
| `Hip_and_Thigh` | CLINICAL_GUIDELINE | `dr_general_hip_thigh` |

All source types are weighted at **precedence 100**.

## Prerequisites

Before running the upload:

1. **Verify folder structure:**
   ```bash
   ls -la "/Users/akris/Downloads/"
   ```

   You should see these folders:
   - UCL RCT
   - RotatorCuff RCT
   - ACL RCT
   - Meniscus RCT
   - Back
   - Neck
   - Hip_and_Thigh

2. **Check that folders contain PDFs:**
   ```bash
   find "/Users/akris/Downloads/UCL RCT" -name "*.pdf" | head -5
   find "/Users/akris/Downloads/RotatorCuff RCT" -name "*.pdf" | head -5
   # etc...
   ```

3. **Ensure services are running:**
   ```bash
   # Check Qdrant is running
   curl http://localhost:6333/collections

   # Check backend services (if applicable)
   # Make sure AWS credentials are configured
   aws sts get-caller-identity
   ```

4. **Set up environment variables:**
   ```bash
   # Make sure .env file has required keys:
   # - OPENAI_API_KEY
   # - AWS_ACCESS_KEY_ID
   # - AWS_SECRET_ACCESS_KEY
   # - S3_BUCKET
   ```

## Upload Instructions

### Option 1: Automated Upload (Recommended)

Run the automated script to upload all 7 sets:

```bash
cd /home/user/protocare-ai/backend
./upload_initial_docs.sh
```

The script will:
- Process all 7 document sets sequentially
- Show progress for each set
- Display summary at the end
- Continue on errors (with `--skip-errors` flag)

### Option 2: Manual Upload (Individual Sets)

Upload each set individually:

```bash
cd /home/user/protocare-ai/backend

# UCL RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "UCL_RCT" \
  --directory "/Users/akris/Downloads/UCL RCT" \
  --source-type RCT \
  --skip-errors

# RotatorCuff RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Rotator_Cuff_RCT" \
  --directory "/Users/akris/Downloads/RotatorCuff RCT" \
  --source-type RCT \
  --skip-errors

# ACL RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "ACL_RCT" \
  --directory "/Users/akris/Downloads/ACL RCT" \
  --source-type RCT \
  --skip-errors

# Meniscus RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Meniscus_RCT" \
  --directory "/Users/akris/Downloads/Meniscus RCT" \
  --source-type RCT \
  --skip-errors

# Back
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Back" \
  --directory "/Users/akris/Downloads/Back" \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Neck
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Neck" \
  --directory "/Users/akris/Downloads/Neck" \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Hip and Thigh
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Hip_Thigh" \
  --directory "/Users/akris/Downloads/Hip_and_Thigh" \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors
```

## What Happens During Upload

For each PDF file, the system will:

1. **Upload to S3**: Stores file at `uploads/doctors/general/{protocol}/{uuid}.pdf`
2. **Parse PDF**: Extracts text (with OCR fallback for scanned documents)
3. **Chunk Text**: Splits into ~1800 character chunks with 200 character overlap
4. **Generate Embeddings**: Uses OpenAI text-embedding-3-small (1536 dimensions)
5. **Store in Qdrant**: Saves embeddings in collection `dr_general_{protocol}`

## Verification

After upload completes, verify the collections were created:

```bash
# List all collections
curl http://localhost:6333/collections | jq '.result.collections[].name'

# Check collection details (example for UCL RCT)
curl http://localhost:6333/collections/dr_general_ucl_rct | jq

# Test a query
curl -X POST http://localhost:8000/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the rehabilitation protocols after ACL reconstruction?",
    "actor": "PROVIDER",
    "org_id": "demo"
  }'
```

## Troubleshooting

### Error: "Directory not found"
- Check the path is correct: `ls -la "/Users/akris/Downloads/"`
- Make sure folder names match exactly (including spaces)

### Error: "No PDF files found"
- Verify PDFs exist: `find "/Users/akris/Downloads/UCL RCT" -name "*.pdf"`
- Check file extensions (.pdf vs .PDF)

### Error: "AWS credentials not found"
- Run: `aws configure`
- Or set environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### Error: "OpenAI API key not found"
- Check `.env` file has `OPENAI_API_KEY=sk-...`
- Or set environment variable: `export OPENAI_API_KEY=sk-...`

### Error: "Qdrant connection failed"
- Check Qdrant is running: `docker ps | grep qdrant`
- Start Qdrant: `docker-compose up -d` (in backend directory)
- Verify endpoint: `curl http://localhost:6333/collections`

### Upload is very slow
- Normal: Processing includes OCR, embedding generation, and vector storage
- Expect ~30-60 seconds per document depending on size
- Large batches may take hours

## Next Steps

After successful upload:

1. **Upload remaining document sets** (Dines protocols, HSS protocols, etc.)
2. **Assign collections to surgeons** (see ASSIGN_COLLECTIONS_GUIDE.md)
3. **Test queries** in the frontend
4. **Monitor performance** and adjust as needed

## Remaining Document Sets

These can be uploaded later:
- Dines-specific clinic protocols
- HSS protocols
- Knee and Lower Leg
- Foot and Ankle
- Shoulder
- Shoulder Replacement Reviews (TSA/RTSA rehabilitation protocols, clinical guidelines)
- Elbow
- AAOS Knee OA Guidelines

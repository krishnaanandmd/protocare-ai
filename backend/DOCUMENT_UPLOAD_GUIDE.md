# Document Upload Guide

## Overview
This guide will help you upload all document sets to the ProtoCare AI system.

## Step 1: Download and Organize Documents

Download all documents from Google Drive and organize them into folders with the following structure:

```
documents/
├── ucl_rct/                    # Source type: RCT
├── rotator_cuff_rct/           # Source type: RCT
├── meniscus_rct/               # Source type: RCT
├── acl_rct/                    # Source type: RCT
├── dines_protocols/            # Source type: CLINICAL_GUIDELINE
├── hss_protocols/              # Source type: CLINICAL_GUIDELINE
├── knee_lower_leg/             # Source type: CLINICAL_GUIDELINE
├── foot_ankle/                 # Source type: CLINICAL_GUIDELINE
├── shoulder/                   # Source type: CLINICAL_GUIDELINE
├── elbow/                      # Source type: CLINICAL_GUIDELINE
├── hip_thigh/                  # Source type: CLINICAL_GUIDELINE
├── neck/                       # Source type: CLINICAL_GUIDELINE
├── back/                       # Source type: CLINICAL_GUIDELINE
├── aaos_knee_oa/               # Source type: AAOS
└── Chahla Documents/           # Source type: DOCTOR_PROTOCOL
    ├── subfolder1/
    ├── subfolder2/
    └── ...
```

**Important:** Place all PDF files for each category into its corresponding folder. The script will find all PDFs recursively.

## Step 2: Upload Documents

Navigate to the backend directory:

```bash
cd /home/user/protocare-ai/backend
```

### For RCT Documents (precedence: 100)

```bash
# UCL RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "UCL_RCT" \
  --directory ~/documents/ucl_rct/ \
  --source-type RCT \
  --skip-errors

# Rotator Cuff RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Rotator_Cuff_RCT" \
  --directory ~/documents/rotator_cuff_rct/ \
  --source-type RCT \
  --skip-errors

# Meniscus RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Meniscus_RCT" \
  --directory ~/documents/meniscus_rct/ \
  --source-type RCT \
  --skip-errors

# ACL RCT
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "ACL_RCT" \
  --directory ~/documents/acl_rct/ \
  --source-type RCT \
  --skip-errors
```

### For AAOS Guidelines (precedence: 100)

```bash
# AAOS Knee OA Guidelines
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "AAOS_Knee_OA" \
  --directory ~/documents/aaos_knee_oa/ \
  --source-type AAOS \
  --skip-errors
```

### For Clinical Guidelines (precedence: 100)

```bash
# Dines-specific clinic protocols
python batch_upload_docs.py \
  --doctor "Joshua_Dines" \
  --protocol "Clinic_Protocols" \
  --directory ~/documents/dines_protocols/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# HSS protocols
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "HSS_Protocols" \
  --directory ~/documents/hss_protocols/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Knee and Lower Leg
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Knee_Lower_Leg" \
  --directory ~/documents/knee_lower_leg/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Foot and Ankle
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Foot_Ankle" \
  --directory ~/documents/foot_ankle/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Shoulder
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Shoulder" \
  --directory ~/documents/shoulder/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Elbow
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Elbow" \
  --directory ~/documents/elbow/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Hip and Thigh
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Hip_Thigh" \
  --directory ~/documents/hip_thigh/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Neck
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Neck" \
  --directory ~/documents/neck/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors

# Back
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Back" \
  --directory ~/documents/back/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors
```

### For Chahla Documents (precedence: 95)

Dr. Jorge Chahla's documents are stored in a "Chahla Documents" folder with subfolders. Each subfolder becomes a separate collection.

**Option 1: Use the dedicated script (recommended)**

```bash
# Upload all Chahla documents at once
./upload_chahla_docs.sh ~/documents/
```

This will:
- Find all subfolders in `~/documents/Chahla Documents/`
- Upload each subfolder as a separate collection (`dr_jorge_chahla_{subfolder_slug}`)

**Option 2: Manual upload per subfolder**

```bash
# Example: Upload a specific subfolder
python batch_upload_docs.py \
  --doctor "Jorge_Chahla" \
  --protocol "Protocols" \
  --directory "~/documents/Chahla Documents/subfolder_name/" \
  --source-type DOCTOR_PROTOCOL \
  --skip-errors
```

## Step 3: Verify Upload

After uploading, you can verify the collections were created:

```bash
# Check Qdrant collections (requires Qdrant running)
curl http://localhost:6333/collections
```

## Collection Names Created

The upload script will create the following collections:

- `dr_general_ucl_rct`
- `dr_general_rotator_cuff_rct`
- `dr_general_meniscus_rct`
- `dr_general_acl_rct`
- `dr_joshua_dines_clinic_protocols`
- `dr_general_hss_protocols`
- `dr_general_knee_lower_leg`
- `dr_general_foot_ankle`
- `dr_general_shoulder`
- `dr_general_elbow`
- `dr_general_hip_thigh`
- `dr_general_neck`
- `dr_general_back`
- `dr_general_aaos_knee_oa`
- `dr_jorge_chahla_*` (one collection per subfolder in Chahla Documents)

## Next Steps

After all documents are uploaded, you can:
1. Assign these collections to specific surgeons by updating the `DOCTORS` dictionary in `/home/user/protocare-ai/backend/app/routers/rag.py`
2. Create shared collections by updating the `SHARED_COLLECTIONS` dictionary
3. Test queries against the new document sets

## Troubleshooting

- **AWS Credentials Error**: Ensure your AWS credentials are configured (`aws configure`)
- **Qdrant Connection Error**: Make sure Qdrant is running (`docker-compose up -d` in the backend directory)
- **OpenAI API Error**: Check that `OPENAI_API_KEY` is set in your `.env` file
- **File Not Found**: Verify the directory paths are correct (use absolute paths if relative paths fail)

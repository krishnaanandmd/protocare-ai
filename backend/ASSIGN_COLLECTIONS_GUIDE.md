# Guide to Assigning Collections to Surgeons

After uploading all documents, you'll have these collections created in Qdrant:

## Collections Created by Upload

| Collection Name | Source Type | Precedence |
|----------------|-------------|------------|
| `dr_general_ucl_rct` | RCT | 100 |
| `dr_general_rotator_cuff_rct` | RCT | 100 |
| `dr_general_meniscus_rct` | RCT | 100 |
| `dr_general_acl_rct` | RCT | 100 |
| `dr_joshua_dines_clinic_protocols` | CLINICAL_GUIDELINE | 100 |
| `dr_general_hss_protocols` | CLINICAL_GUIDELINE | 100 |
| `dr_general_knee_lower_leg` | CLINICAL_GUIDELINE | 100 |
| `dr_general_foot_ankle` | CLINICAL_GUIDELINE | 100 |
| `dr_general_shoulder` | CLINICAL_GUIDELINE | 100 |
| `dr_general_elbow` | CLINICAL_GUIDELINE | 100 |
| `dr_general_hip_thigh` | CLINICAL_GUIDELINE | 100 |
| `dr_general_neck` | CLINICAL_GUIDELINE | 100 |
| `dr_general_back` | CLINICAL_GUIDELINE | 100 |
| `dr_general_aaos_knee_oa` | AAOS | 100 |

## How to Assign Collections to Surgeons

Collections are automatically discovered by the system based on the naming pattern `dr_{doctor_id}_{protocol}`.

### Current Surgeons

1. **Dr. Joshua Dines** (`joshua_dines`) - Sports Medicine
2. **Dr. Asheesh Bedi** (`asheesh_bedi`) - Sports Medicine
3. **Dr. Ayoosh Pareek** (`ayoosh_pareek`) - Sports Medicine
4. **Dr. Sheeraz Qureshi** (`sheeraz_qureshi`) - Spine Surgery
5. **Dr. Khalid Alkhelaifi** (`khalid_alkhelaifi`) - Sports Medicine
6. **Dr. William Long** (`william_long`) - Joint Replacement

### Option 1: Re-upload with Specific Doctor Names

To assign documents to a specific surgeon, re-upload using their doctor name instead of "General":

```bash
# Example: Assign UCL RCT to Dr. Joshua Dines
python batch_upload_docs.py \
  --doctor "Joshua_Dines" \
  --protocol "UCL_RCT" \
  --directory ~/documents/ucl_rct/ \
  --source-type RCT \
  --skip-errors
```

This will create: `dr_joshua_dines_ucl_rct`

### Option 2: Use Shared Collections

Edit `/home/user/protocare-ai/backend/app/routers/rag.py` and modify the `SHARED_COLLECTIONS` dictionary:

```python
SHARED_COLLECTIONS = {
    "asheesh_bedi": ["joshua_dines"],  # Dr. Bedi uses Dr. Dines' documents
    "joshua_dines": ["general"],       # Dr. Dines uses general collections
    "ayoosh_pareek": ["general"],      # Dr. Pareek uses general collections
    "sheeraz_qureshi": ["general"],    # Dr. Qureshi uses general collections
    "khalid_alkhelaifi": ["general"],  # Dr. Alkhelaifi uses general collections
    "william_long": ["general"],       # Dr. Long uses general collections
}
```

This allows surgeons to access the "general" collections without duplicating data.

### Option 3: Create CareGuide MSK Body Part Models

The system already supports body-part based queries (not surgeon-specific). These work with collections based on body parts.

To make the uploaded documents available for body-part queries, you can:

1. Rename collections by re-uploading with body part names as the "doctor":

```bash
# Example: Upload shoulder documents for body-part queries
python batch_upload_docs.py \
  --doctor "Shoulder" \
  --protocol "General_Protocols" \
  --directory ~/documents/shoulder/ \
  --source-type CLINICAL_GUIDELINE \
  --skip-errors
```

This creates: `dr_shoulder_general_protocols`

2. Or create a mapping in the code to point body parts to the appropriate collections.

## Verification

After assignment, you can verify collections are being searched correctly:

```bash
# List all collections
curl http://localhost:6333/collections | jq '.result.collections[].name'

# Test a query via the API
curl -X POST http://localhost:8000/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the post-operative protocols for UCL reconstruction?",
    "actor": "PROVIDER",
    "doctor_id": "joshua_dines",
    "org_id": "demo"
  }'
```

## Recommended Assignment Strategy

Based on the document sets, here's a suggested mapping:

### Sports Medicine Surgeons (Dines, Bedi, Pareek, Alkhelaifi)
- UCL RCT
- Rotator Cuff RCT
- ACL RCT
- Meniscus RCT
- Dines protocols
- HSS protocols
- Shoulder documents
- Knee and Lower Leg documents

### Spine Surgeons (Qureshi)
- Neck documents
- Back documents
- HSS protocols

### Joint Replacement Surgeons (Long)
- Knee and Lower Leg documents
- Hip and Thigh documents
- AAOS Knee OA Guidelines
- HSS protocols

### All Surgeons
- AAOS Knee OA Guidelines (for reference)
- Foot and Ankle documents
- Elbow documents

You can implement this by uploading separate copies for each surgeon or using the `SHARED_COLLECTIONS` approach.

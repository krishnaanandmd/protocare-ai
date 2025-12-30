# Document Collection Assignment Summary

## All RCT Assignments Complete ✅

### UCL RCT - Assigned To:

**Surgeons:**
- ✅ Dr. Joshua Dines (Sports Medicine)
- ✅ Dr. Asheesh Bedi (Sports Medicine)
- ✅ Dr. Ayoosh Pareek (Sports Medicine)
- ✅ Dr. Khalid Alkhelaifi (Sports Medicine)

**CareGuide Models:**
- ✅ CareGuide Elbow

### Rotator Cuff RCT - Assigned To:

**Surgeons:**
- ✅ Dr. Joshua Dines (Sports Medicine)
- ✅ Dr. Asheesh Bedi (Sports Medicine)
- ✅ Dr. Ayoosh Pareek (Sports Medicine)
- ✅ Dr. Khalid Alkhelaifi (Sports Medicine)

**CareGuide Models:**
- ✅ CareGuide Shoulder

### Meniscus RCT - Assigned To:

**Surgeons:**
- ✅ Dr. Joshua Dines (Sports Medicine)
- ✅ Dr. Asheesh Bedi (Sports Medicine)
- ✅ Dr. Ayoosh Pareek (Sports Medicine)
- ✅ Dr. Khalid Alkhelaifi (Sports Medicine)

**CareGuide Models:**
- ✅ CareGuide Knee

### ACL RCT - Assigned To:

**Surgeons:**
- ✅ Dr. Joshua Dines (Sports Medicine)
- ✅ Dr. Asheesh Bedi (Sports Medicine)
- ✅ Dr. Ayoosh Pareek (Sports Medicine)
- ✅ Dr. Khalid Alkhelaifi (Sports Medicine)

**CareGuide Models:**
- ✅ CareGuide Knee

### Implementation:

1. **SHARED_COLLECTIONS** (backend/app/routers/rag.py:161-166)
   - Added "general" to each surgeon's shared collections list
   - Allows these surgeons to access all `dr_general_*` collections
   - Includes: UCL RCT, ACL RCT, Rotator Cuff RCT, Meniscus RCT, etc.

2. **CareGuide Body-Part Queries** (backend/app/routers/rag.py:682-713)
   - New logic for body-part queries without doctor selection
   - Maps body parts to relevant collections:
     - **Elbow** → searches UCL RCT, Elbow collections
     - **Knee** → searches ACL RCT, Meniscus RCT, Knee collections
     - **Shoulder** → searches Rotator Cuff RCT, Shoulder collections
     - **Hip** → searches Hip & Thigh collections
     - **Back** → searches Back collections
     - **Neck** → searches Neck collections

## How It Works

### When a surgeon is selected:
1. System looks up surgeon in SHARED_COLLECTIONS
2. Searches all collections for that surgeon AND shared doctors
3. For Dr. Joshua Dines, searches:
   - `dr_joshua_dines_*` (his specific collections)
   - `dr_general_*` (general RCTs and guidelines)

### When CareGuide body part is selected (no doctor):
1. System identifies the body part (e.g., "elbow")
2. Searches all `dr_general_*` collections matching that body part
3. For "Elbow", searches:
   - `dr_general_ucl_rct`
   - `dr_general_elbow`
   - Any other elbow-related collections

## Adding Future Assignments

### To assign a collection to a surgeon:

**Option 1: Use SHARED_COLLECTIONS (recommended for general collections)**

Edit `backend/app/routers/rag.py`:

```python
SHARED_COLLECTIONS = {
    "asheesh_bedi": ["joshua_dines", "general"],
    "joshua_dines": ["general"],
    "ayoosh_pareek": ["general"],
    "khalid_alkhelaifi": ["general"],
    "william_long": ["general"],  # Add more surgeons here
}
```

**Option 2: Upload with specific doctor name**

```bash
python batch_upload_docs.py \
  --doctor "Joshua_Dines" \
  --protocol "Specific_Protocol" \
  --directory /path/to/docs/ \
  --source-type CLINICAL_GUIDELINE
```

This creates: `dr_joshua_dines_specific_protocol`

### To add a collection to CareGuide body-part queries:

**Option 1: Update body_part_matches mapping**

Edit `backend/app/routers/rag.py` (lines 698-705):

```python
body_part_matches = {
    "elbow": ["ucl", "elbow"],
    "knee": ["acl", "meniscus", "knee", "aaos_knee"],
    "shoulder": ["rotator_cuff", "shoulder"],
    "hip": ["hip"],
    "back": ["back"],
    "neck": ["neck"],
    "foot": ["foot", "ankle"],  # Add new body parts
}
```

**Option 2: Use naming convention**

Upload with "General" doctor and body part name in protocol:

```bash
python batch_upload_docs.py \
  --doctor "General" \
  --protocol "Foot_Ankle" \
  --directory /path/to/docs/ \
  --source-type CLINICAL_GUIDELINE
```

Creates: `dr_general_foot_ankle` (automatically discovered by CareGuide Foot queries)

## Collection Naming Convention

- **Surgeon-specific**: `dr_{surgeon_slug}_{protocol_slug}`
  - Example: `dr_joshua_dines_ucl`

- **General collections**: `dr_general_{protocol_slug}`
  - Example: `dr_general_ucl_rct`

- **Body-part collections**: `dr_general_{body_part_slug}`
  - Example: `dr_general_shoulder`

## Current Collections

After upload, you should have:

| Collection Name | Assigned Surgeons | CareGuide Model | Status |
|----------------|-------------------|-----------------|--------|
| `dr_general_ucl_rct` | Dines, Bedi, Pareek, Alkhelaifi | Elbow | ✅ Complete |
| `dr_general_rotator_cuff_rct` | Dines, Bedi, Pareek, Alkhelaifi | Shoulder | ✅ Complete |
| `dr_general_acl_rct` | Dines, Bedi, Pareek, Alkhelaifi | Knee | ✅ Complete |
| `dr_general_meniscus_rct` | Dines, Bedi, Pareek, Alkhelaifi | Knee | ✅ Complete |
| `dr_general_back` | All surgeons with "general" | Back | ✅ Complete |
| `dr_general_neck` | All surgeons with "general" | Neck | ✅ Complete |
| `dr_general_hip_thigh` | All surgeons with "general" | Hip | ✅ Complete |

## Verification

To verify assignments work, test queries:

### Test Surgeon Access:
```bash
curl -X POST http://localhost:8000/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the rehab protocols for UCL reconstruction?",
    "actor": "PROVIDER",
    "doctor_id": "joshua_dines",
    "org_id": "demo"
  }'
```

### Test CareGuide Elbow:
```bash
curl -X POST http://localhost:8000/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the rehab protocols for UCL reconstruction?",
    "actor": "PROVIDER",
    "body_part": "elbow",
    "org_id": "demo"
  }'
```

Both should return results from the UCL RCT collection!

## Next Steps

1. ✅ UCL RCT assigned to surgeons and CareGuide Elbow
2. ✅ Rotator Cuff RCT assigned to surgeons and CareGuide Shoulder
3. ✅ Meniscus RCT assigned to surgeons and CareGuide Knee
4. ✅ ACL RCT assigned to surgeons and CareGuide Knee
5. ✅ Back, Neck, Hip & Thigh assigned to CareGuide body parts
6. ⏳ Upload remaining document sets (Dines protocols, HSS, Foot/Ankle, etc.)
7. ⏳ Test queries in frontend
8. ⏳ Assign collections to additional surgeons (Qureshi for spine, Long for knee/hip)

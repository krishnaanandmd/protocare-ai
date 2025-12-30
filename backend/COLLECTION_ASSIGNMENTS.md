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

1. **COLLECTION_PERMISSIONS** (backend/app/routers/rag.py:167-188)
   - **Explicit permission mapping** for each collection
   - Each surgeon is individually listed for each collection they can access
   - Provides **granular control** - surgeons ONLY see collections they're explicitly assigned to

   ```python
   COLLECTION_PERMISSIONS = {
       "dr_general_ucl_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi"],
       "dr_general_rotator_cuff_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi"],
       "dr_general_meniscus_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi"],
       "dr_general_acl_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi"],
       "dr_general_back": ["sheeraz_qureshi"],
       "dr_general_neck": ["sheeraz_qureshi"],
       "dr_general_hip_thigh": ["william_long", "khalid_alkhelaifi"],
   }
   ```

2. **CareGuide Body-Part Queries** (backend/app/routers/rag.py:710-741)
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
1. System searches their own collections (`dr_{doctor}_*`)
2. System checks COLLECTION_PERMISSIONS for additional collections
3. System checks SHARED_COLLECTIONS for shared doctor collections
4. For Dr. Joshua Dines, searches:
   - `dr_joshua_dines_*` (his specific collections)
   - Collections explicitly listed in COLLECTION_PERMISSIONS (UCL RCT, Rotator Cuff RCT, etc.)

### When CareGuide body part is selected (no doctor):
1. System identifies the body part (e.g., "elbow")
2. Searches all `dr_general_*` collections matching that body part
3. For "Elbow", searches:
   - `dr_general_ucl_rct`
   - `dr_general_elbow`
   - Any other elbow-related collections

## Adding Future Assignments

### To assign a collection to a surgeon:

**Option 1: Use COLLECTION_PERMISSIONS (recommended for explicit control)**

Edit `backend/app/routers/rag.py` and add the collection to `COLLECTION_PERMISSIONS`:

```python
COLLECTION_PERMISSIONS = {
    # Existing assignments...
    "dr_general_ucl_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi"],

    # Add new collection assignment
    "dr_general_shoulder": ["joshua_dines", "asheesh_bedi"],  # Specify exact surgeons
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
| `dr_general_ucl_rct` | Dines, Bedi, Pareek, Alkhelaifi | Elbow | ✅ Explicit Assignment |
| `dr_general_rotator_cuff_rct` | Dines, Bedi, Pareek, Alkhelaifi | Shoulder | ✅ Explicit Assignment |
| `dr_general_acl_rct` | Dines, Bedi, Pareek, Alkhelaifi | Knee | ✅ Explicit Assignment |
| `dr_general_meniscus_rct` | Dines, Bedi, Pareek, Alkhelaifi | Knee | ✅ Explicit Assignment |
| `dr_general_back` | Qureshi | Back | ✅ Explicit Assignment |
| `dr_general_neck` | Qureshi | Neck | ✅ Explicit Assignment |
| `dr_general_hip_thigh` | Long, Alkhelaifi | Hip | ✅ Explicit Assignment |

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

## Key Differences from Broad Sharing

**OLD Approach (broad sharing):**
- Added "general" to SHARED_COLLECTIONS
- Surgeon gets access to ALL `dr_general_*` collections automatically
- No control over which specific collections they see

**NEW Approach (explicit permissions):**
- Each collection lists exact surgeons who can access it
- Surgeons ONLY see collections they're explicitly listed in
- Full control - add/remove surgeons per collection
- Dr. Qureshi only sees Back/Neck (not knee/shoulder RCTs)
- Dr. Long only sees Hip/Thigh (not elbow/shoulder RCTs)

## Next Steps

1. ✅ UCL RCT assigned to Dines, Bedi, Pareek, Alkhelaifi + CareGuide Elbow
2. ✅ Rotator Cuff RCT assigned to Dines, Bedi, Pareek, Alkhelaifi + CareGuide Shoulder
3. ✅ Meniscus RCT assigned to Dines, Bedi, Pareek, Alkhelaifi + CareGuide Knee
4. ✅ ACL RCT assigned to Dines, Bedi, Pareek, Alkhelaifi + CareGuide Knee
5. ✅ Back assigned to Qureshi + CareGuide Back
6. ✅ Neck assigned to Qureshi + CareGuide Neck
7. ✅ Hip & Thigh assigned to Long, Alkhelaifi + CareGuide Hip
8. ⏳ Upload remaining document sets (Dines protocols, HSS, Foot/Ankle, etc.)
9. ⏳ Test queries in frontend

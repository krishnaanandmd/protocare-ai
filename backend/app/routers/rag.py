import time
from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, Answer, Citation, DoctorProfile
from app.core.logging import logger
from app.core.config import settings
from app.services import retrieval
from app.services.s3_uploads import presign_get

router = APIRouter()

@router.get("/debug/check-collection/{collection_name}")
async def check_specific_collection(collection_name: str):
    """Check if a specific collection exists and has points."""
    try:
        c = retrieval.client()
        col_info = c.get_collection(collection_name)
        
        # Try a test search
        try:
            test_results = retrieval.search("test", top_k=3, collection_name=collection_name)
            search_works = True
            num_results = len(test_results)
        except Exception as search_error:
            search_works = False
            num_results = 0
            
        return {
            "collection_name": collection_name,
            "exists": True,
            "points_count": col_info.points_count,
            "vectors_count": col_info.vectors_count,
            "search_works": search_works,
            "test_search_results": num_results
        }
    except Exception as e:
        return {
            "collection_name": collection_name,
            "exists": False,
            "error": str(e)
        }

@router.get("/debug/test-query")
async def test_query_logic():
    """Test the exact query logic."""
    try:
        doctor_id = "joshua_dines"
        doctor_slug = slugify(doctor_id)
        doctor_prefix = f"dr_{doctor_slug}_"
        
        c = retrieval.client()
        all_collections_response = c.get_collections()
        all_collection_names = [col.name for col in all_collections_response.collections]
        
        matching_collections = [
            name for name in all_collection_names 
            if name.startswith(doctor_prefix)
        ]
        
        # Try searching
        search_results = []
        if matching_collections:
            for col_name in matching_collections:
                try:
                    hits = retrieval.search("UCL repair precautions", top_k=3, collection_name=col_name)
                    search_results.append({
                        "collection": col_name,
                        "hits": len(hits),
                        "works": True
                    })
                except Exception as e:
                    search_results.append({
                        "collection": col_name,
                        "error": str(e)
                    })
        
        return {
            "doctor_id": doctor_id,
            "search_prefix": doctor_prefix,
            "all_collections": all_collection_names,
            "matching_collections": matching_collections,
            "search_results": search_results
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/debug/env")
async def debug_environment():
    """Check which Qdrant the API is connected to."""
    return {
        "qdrant_url": settings.qdrant_url,
        "s3_bucket": settings.s3_bucket
    }

@router.get("/debug/collections")
async def list_collections():
    """List all Qdrant collections."""
    try:
        c = retrieval.client()
        collections = c.get_collections().collections
        
        result = []
        for col in collections:
            try:
                col_info = c.get_collection(col.name)
                result.append({
                    "name": col.name,
                    "points_count": col_info.points_count
                })
            except Exception as e:
                result.append({"name": col.name, "error": str(e)})
        
        return {"total": len(collections), "collections": result}
    except Exception as e:
        return {"error": str(e)}

@router.get("/debug/doctor-collections/{doctor_id}")
async def debug_doctor_collections(doctor_id: str):
    """Show exactly which collections would be searched for a given doctor."""
    try:
        c = retrieval.client()
        all_collections = c.get_collections().collections

        doctors_to_search = [doctor_id]
        if doctor_id in SHARED_COLLECTIONS:
            doctors_to_search.extend(SHARED_COLLECTIONS[doctor_id])

        # Doctor-prefixed collections
        own_collections = []
        shared_collections = []
        for doc_id in doctors_to_search:
            doc_slug = slugify(doc_id)
            prefix = f"dr_{doc_slug}_"
            for col in all_collections:
                if col.name.startswith(prefix):
                    col_info = c.get_collection(col.name)
                    entry = {"name": col.name, "points_count": col_info.points_count}
                    if doc_id == doctor_id:
                        own_collections.append(entry)
                    else:
                        shared_collections.append(entry)

        # Permission-based collections
        permission_collections = []
        for col_name, allowed in COLLECTION_PERMISSIONS.items():
            if doctor_id in allowed:
                try:
                    col_info = c.get_collection(col_name)
                    permission_collections.append({"name": col_name, "points_count": col_info.points_count})
                except Exception:
                    permission_collections.append({"name": col_name, "points_count": 0, "note": "collection not found"})

        return {
            "doctor_id": doctor_id,
            "own_collections": own_collections,
            "shared_collections": shared_collections,
            "permission_collections": permission_collections,
            "total_searched": len(own_collections) + len(shared_collections) + len(permission_collections),
        }
    except Exception as e:
        return {"error": str(e)}

# Sample doctor profiles (in production, this would be a database)
DOCTORS = {
    "joshua_dines": {
        "id": "joshua_dines",
        "name": "Dr. Joshua Dines",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "procedures": ["ucl", "acl", "rotator_cuff"]
    },
    "asheesh_bedi": {
        "id": "asheesh_bedi",
        "name": "Dr. Asheesh Bedi",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "procedures": ["ucl", "acl", "rotator_cuff"]
    },
    "ayoosh_pareek": {
        "id": "ayoosh_pareek",
        "name": "Dr. Ayoosh Pareek",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "procedures": ["acl", "meniscus", "cartilage_restoration"]
    },
    "sheeraz_qureshi": {
        "id": "sheeraz_qureshi",
        "name": "Dr. Sheeraz Qureshi",
        "specialty": "Orthopedic Surgery - Spine Surgery",
        "procedures": ["spinal_fusion", "disc_replacement", "decompression"]
    },
    "khalid_alkhelaifi": {
        "id": "khalid_alkhelaifi",
        "name": "Dr. Khalid Alkhelaifi",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "procedures": ["hip_arthroscopy", "acl", "shoulder_instability"]
    },
    "william_long": {
        "id": "william_long",
        "name": "Dr. William Long",
        "specialty": "Orthopedic Surgery - Joint Replacement",
        "procedures": ["total_hip", "total_knee", "revision_arthroplasty"]
    },
    "jorge_chahla": {
        "id": "jorge_chahla",
        "name": "Dr. Jorge Chahla",
        "specialty": "Orthopedic Surgery - Sports Medicine",
        "procedures": ["ucl", "rotator_cuff", "meniscus", "acl"]
    }
}

# Map doctors to additional doctors whose collections they should search
# This allows multiple doctors to share the same document collections
SHARED_COLLECTIONS = {
    "asheesh_bedi": ["joshua_dines"]  # Dr. Bedi uses Dr. Dines' documents
}

# Explicit collection permissions - maps collections to allowed surgeons
# This provides granular control over which surgeons can access which collections
COLLECTION_PERMISSIONS = {
    # RCT Documents
    "dr_general_ucl_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi", "jorge_chahla"],
    "dr_general_rotator_cuff_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi", "jorge_chahla"],
    "dr_general_meniscus_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi", "jorge_chahla"],
    "dr_general_acl_rct": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi", "jorge_chahla"],

    # Dines-specific protocols
    "dr_joshua_dines_clinic_protocols": ["joshua_dines", "asheesh_bedi"],

    # Chahla-specific protocols (uploaded from "Chahla Documents" folder)
    # Note: Collections with prefix "dr_jorge_chahla_*" are automatically
    # accessible to Dr. Chahla. Add entries here only if other doctors
    # need access to specific Chahla collections.
    # Example: "dr_jorge_chahla_hip_protocols": ["jorge_chahla", "william_long"],

    # Bedi-specific protocols (uploaded from "Bedi_CareGuide" folder)
    # Note: Collections with prefix "dr_asheesh_bedi_*" are automatically
    # accessible to Dr. Bedi. Add entries here only if other doctors
    # need access to specific Bedi collections.
    # Example: "dr_asheesh_bedi_hip_protocols": ["asheesh_bedi", "jorge_chahla"],

    # HSS protocols
    "dr_general_hss_protocols": ["joshua_dines", "ayoosh_pareek", "sheeraz_qureshi", "william_long"],

    # Body part specific collections
    "dr_general_knee_lower_leg": ["william_long", "khalid_alkhelaifi", "jorge_chahla"],
    "dr_general_foot_ankle": [],  # CareGuide only
    "dr_general_shoulder": ["joshua_dines", "asheesh_bedi", "ayoosh_pareek", "khalid_alkhelaifi", "jorge_chahla"],
    "dr_general_elbow": ["joshua_dines", "ayoosh_pareek", "khalid_alkhelaifi", "jorge_chahla"],
    "dr_general_hip_thigh": ["asheesh_bedi", "william_long", "jorge_chahla"],
    "dr_general_neck": ["sheeraz_qureshi"],
    "dr_general_back": ["sheeraz_qureshi"],

    # AAOS Guidelines
    "dr_general_aaos_knee_oa": ["william_long"],
}

PROCEDURES = {
    "ucl": {"id": "ucl", "name": "UCL Reconstruction (Tommy John)", "description": "Ulnar collateral ligament reconstruction"},
    "acl": {"id": "acl", "name": "ACL Reconstruction", "description": "Anterior cruciate ligament reconstruction"},
    "rotator_cuff": {"id": "rotator_cuff", "name": "Rotator Cuff Repair", "description": "Surgical repair of torn rotator cuff"}
}

# Map body parts to related collection name keywords.
# Used to find relevant collections when a body part is selected.
BODY_PART_COLLECTION_KEYWORDS = {
    "elbow": ["ucl", "elbow"],
    "knee": ["acl", "meniscus", "knee", "aaos_knee", "lower_leg"],
    "shoulder": ["rotator_cuff", "shoulder"],
    "hip": ["hip", "thigh"],
    "back": ["back"],
    "neck": ["neck"],
    "spine": ["back", "neck"],
    "foot": ["foot", "ankle"],
    "ankle": ["foot", "ankle"],
    "hand": ["hand", "wrist"],
    "wrist": ["hand", "wrist"],
}

# Detailed conditions and procedures by surgeon specialty
SURGEON_SPECIALTIES = {
    "joshua_dines": {
        "categories": [
            {
                "name": "Shoulder",
                "icon": "shoulder",
                "conditions": [
                    {
                        "name": "Rotator Cuff Tears",
                        "description": "Partial or complete tears of the rotator cuff tendons",
                        "procedures": ["Rotator Cuff Repair", "Rotator Cuff Reconstruction"]
                    },
                    {
                        "name": "Shoulder Instability",
                        "description": "Recurrent shoulder dislocations or subluxations",
                        "procedures": ["Bankart Repair", "Latarjet Procedure"]
                    },
                    {
                        "name": "Labral Tears (SLAP)",
                        "description": "Superior labrum anterior-posterior tears",
                        "procedures": ["SLAP Repair", "Biceps Tenodesis"]
                    },
                    {
                        "name": "Shoulder Arthritis",
                        "description": "Degenerative changes in the shoulder joint",
                        "procedures": ["Shoulder Arthroscopy", "Debridement"]
                    },
                    {
                        "name": "AC Joint Injuries",
                        "description": "Acromioclavicular joint separations",
                        "procedures": ["AC Joint Reconstruction", "Distal Clavicle Excision"]
                    }
                ]
            },
            {
                "name": "Elbow",
                "icon": "elbow",
                "conditions": [
                    {
                        "name": "UCL Injuries",
                        "description": "Ulnar collateral ligament tears common in throwing athletes",
                        "procedures": ["UCL Reconstruction (Tommy John)", "UCL Repair"]
                    },
                    {
                        "name": "Tennis Elbow",
                        "description": "Lateral epicondylitis causing outer elbow pain",
                        "procedures": ["Lateral Epicondyle Release", "PRP Injection"]
                    },
                    {
                        "name": "Golfer's Elbow",
                        "description": "Medial epicondylitis causing inner elbow pain",
                        "procedures": ["Medial Epicondyle Release", "PRP Injection"]
                    },
                    {
                        "name": "Elbow Instability",
                        "description": "Recurrent elbow dislocations or laxity",
                        "procedures": ["Ligament Reconstruction", "Elbow Arthroscopy"]
                    }
                ]
            },
            {
                "name": "Knee",
                "icon": "knee",
                "conditions": [
                    {
                        "name": "ACL Tears",
                        "description": "Anterior cruciate ligament injuries",
                        "procedures": ["ACL Reconstruction", "ACL Repair"]
                    },
                    {
                        "name": "Meniscus Tears",
                        "description": "Tears of the knee meniscus cartilage",
                        "procedures": ["Meniscus Repair", "Partial Meniscectomy"]
                    },
                    {
                        "name": "Cartilage Injuries",
                        "description": "Damage to knee articular cartilage",
                        "procedures": ["Microfracture", "Cartilage Transplant"]
                    }
                ]
            }
        ]
    },
    "ayoosh_pareek": {
        "categories": [
            {
                "name": "Knee",
                "icon": "knee",
                "conditions": [
                    {
                        "name": "ACL Tears",
                        "description": "Anterior cruciate ligament injuries",
                        "procedures": ["ACL Reconstruction", "ACL Repair", "Revision ACL Reconstruction"]
                    },
                    {
                        "name": "Meniscus Tears",
                        "description": "Tears of the knee meniscus cartilage",
                        "procedures": ["Meniscus Repair", "Partial Meniscectomy", "Meniscal Transplant"]
                    },
                    {
                        "name": "Cartilage Injuries",
                        "description": "Damage to knee articular cartilage",
                        "procedures": ["Cartilage Restoration", "Osteochondral Allograft", "MACI"]
                    },
                    {
                        "name": "Multiligament Knee Injuries",
                        "description": "Complex injuries involving multiple knee ligaments",
                        "procedures": ["Multiligament Reconstruction", "PCL Reconstruction"]
                    }
                ]
            },
            {
                "name": "Hip",
                "icon": "hip",
                "conditions": [
                    {
                        "name": "Labral Tears",
                        "description": "Tears of the hip labrum",
                        "procedures": ["Hip Arthroscopy", "Labral Repair"]
                    },
                    {
                        "name": "FAI (Femoroacetabular Impingement)",
                        "description": "Hip impingement causing pain and damage",
                        "procedures": ["Hip Arthroscopy", "Osteoplasty"]
                    }
                ]
            }
        ]
    },
    "sheeraz_qureshi": {
        "categories": [
            {
                "name": "Cervical Spine",
                "icon": "spine",
                "conditions": [
                    {
                        "name": "Cervical Disc Herniation",
                        "description": "Herniated disc in the neck causing nerve compression",
                        "procedures": ["Anterior Cervical Discectomy and Fusion (ACDF)", "Cervical Disc Replacement"]
                    },
                    {
                        "name": "Cervical Stenosis",
                        "description": "Narrowing of the spinal canal in the neck",
                        "procedures": ["Cervical Laminectomy", "Cervical Laminoplasty"]
                    },
                    {
                        "name": "Cervical Myelopathy",
                        "description": "Spinal cord compression in the neck",
                        "procedures": ["Cervical Decompression", "Multilevel Fusion"]
                    }
                ]
            },
            {
                "name": "Lumbar Spine",
                "icon": "spine",
                "conditions": [
                    {
                        "name": "Lumbar Disc Herniation",
                        "description": "Herniated disc in the lower back",
                        "procedures": ["Microdiscectomy", "Lumbar Discectomy"]
                    },
                    {
                        "name": "Lumbar Stenosis",
                        "description": "Narrowing of the spinal canal in the lower back",
                        "procedures": ["Lumbar Decompression", "Laminectomy"]
                    },
                    {
                        "name": "Spondylolisthesis",
                        "description": "Vertebra slipping forward over another",
                        "procedures": ["Spinal Fusion", "TLIF (Transforaminal Lumbar Interbody Fusion)"]
                    },
                    {
                        "name": "Degenerative Disc Disease",
                        "description": "Breakdown of intervertebral discs",
                        "procedures": ["Lumbar Fusion", "Artificial Disc Replacement"]
                    }
                ]
            },
            {
                "name": "Thoracic Spine",
                "icon": "spine",
                "conditions": [
                    {
                        "name": "Thoracic Disc Herniation",
                        "description": "Herniated disc in the mid-back",
                        "procedures": ["Thoracic Discectomy", "Thoracoscopic Surgery"]
                    },
                    {
                        "name": "Spinal Deformity",
                        "description": "Scoliosis and kyphosis",
                        "procedures": ["Spinal Fusion", "Deformity Correction"]
                    }
                ]
            }
        ]
    },
    "khalid_alkhelaifi": {
        "categories": [
            {
                "name": "Hip",
                "icon": "hip",
                "conditions": [
                    {
                        "name": "Hip Labral Tears",
                        "description": "Tears of the hip labrum",
                        "procedures": ["Hip Arthroscopy", "Labral Repair", "Labral Reconstruction"]
                    },
                    {
                        "name": "FAI (Femoroacetabular Impingement)",
                        "description": "Hip impingement syndrome",
                        "procedures": ["Hip Arthroscopy", "Cam/Pincer Resection"]
                    },
                    {
                        "name": "Hip Cartilage Damage",
                        "description": "Damage to hip articular cartilage",
                        "procedures": ["Microfracture", "Cartilage Restoration"]
                    },
                    {
                        "name": "Athletic Pubalgia (Sports Hernia)",
                        "description": "Groin pain in athletes",
                        "procedures": ["Core Muscle Repair", "Sports Hernia Repair"]
                    }
                ]
            },
            {
                "name": "Knee",
                "icon": "knee",
                "conditions": [
                    {
                        "name": "ACL Tears",
                        "description": "Anterior cruciate ligament injuries",
                        "procedures": ["ACL Reconstruction", "ACL Repair"]
                    },
                    {
                        "name": "Meniscus Tears",
                        "description": "Tears of the knee meniscus",
                        "procedures": ["Meniscus Repair", "Partial Meniscectomy"]
                    }
                ]
            },
            {
                "name": "Shoulder",
                "icon": "shoulder",
                "conditions": [
                    {
                        "name": "Shoulder Instability",
                        "description": "Recurrent shoulder dislocations",
                        "procedures": ["Bankart Repair", "Latarjet Procedure", "Remplissage"]
                    },
                    {
                        "name": "Rotator Cuff Tears",
                        "description": "Tears of the rotator cuff tendons",
                        "procedures": ["Rotator Cuff Repair", "Arthroscopic Repair"]
                    }
                ]
            }
        ]
    },
    "william_long": {
        "categories": [
            {
                "name": "Hip",
                "icon": "hip",
                "conditions": [
                    {
                        "name": "Hip Osteoarthritis",
                        "description": "Degenerative arthritis of the hip joint",
                        "procedures": ["Total Hip Replacement", "Anterior Approach THR", "Posterior Approach THR"]
                    },
                    {
                        "name": "Avascular Necrosis",
                        "description": "Loss of blood supply to the hip bone",
                        "procedures": ["Total Hip Replacement", "Hip Resurfacing"]
                    },
                    {
                        "name": "Failed Hip Replacement",
                        "description": "Complications from previous hip replacement",
                        "procedures": ["Revision Hip Replacement", "Complex Revision Arthroplasty"]
                    },
                    {
                        "name": "Hip Dysplasia",
                        "description": "Abnormal development of the hip joint",
                        "procedures": ["Total Hip Replacement", "Periacetabular Osteotomy"]
                    }
                ]
            },
            {
                "name": "Knee",
                "icon": "knee",
                "conditions": [
                    {
                        "name": "Knee Osteoarthritis",
                        "description": "Degenerative arthritis of the knee joint",
                        "procedures": ["Total Knee Replacement", "Partial Knee Replacement"]
                    },
                    {
                        "name": "Failed Knee Replacement",
                        "description": "Complications from previous knee replacement",
                        "procedures": ["Revision Knee Replacement", "Complex Revision Surgery"]
                    },
                    {
                        "name": "Post-Traumatic Arthritis",
                        "description": "Arthritis following knee injury",
                        "procedures": ["Total Knee Replacement", "Unicompartmental Knee Replacement"]
                    }
                ]
            }
        ]
    },
    "jorge_chahla": {
        "categories": [
            {
                "name": "Shoulder",
                "icon": "shoulder",
                "conditions": [
                    {
                        "name": "Rotator Cuff Tears",
                        "description": "Partial or complete tears of the rotator cuff tendons",
                        "procedures": ["Rotator Cuff Repair", "Rotator Cuff Reconstruction", "Superior Capsular Reconstruction"]
                    },
                    {
                        "name": "Shoulder Instability",
                        "description": "Recurrent shoulder dislocations or subluxations",
                        "procedures": ["Bankart Repair", "Latarjet Procedure", "Remplissage"]
                    },
                    {
                        "name": "Labral Tears (SLAP)",
                        "description": "Superior labrum anterior-posterior tears",
                        "procedures": ["SLAP Repair", "Biceps Tenodesis"]
                    },
                    {
                        "name": "AC Joint Injuries",
                        "description": "Acromioclavicular joint separations",
                        "procedures": ["AC Joint Reconstruction", "Distal Clavicle Excision"]
                    }
                ]
            },
            {
                "name": "Elbow",
                "icon": "elbow",
                "conditions": [
                    {
                        "name": "UCL Injuries",
                        "description": "Ulnar collateral ligament tears common in throwing athletes",
                        "procedures": ["UCL Reconstruction (Tommy John)", "UCL Repair with Internal Brace"]
                    },
                    {
                        "name": "Tennis Elbow",
                        "description": "Lateral epicondylitis causing outer elbow pain",
                        "procedures": ["Lateral Epicondyle Release", "PRP Injection"]
                    },
                    {
                        "name": "Elbow Instability",
                        "description": "Recurrent elbow dislocations or laxity",
                        "procedures": ["Ligament Reconstruction", "Elbow Arthroscopy"]
                    }
                ]
            },
            {
                "name": "Knee",
                "icon": "knee",
                "conditions": [
                    {
                        "name": "ACL Tears",
                        "description": "Anterior cruciate ligament injuries",
                        "procedures": ["ACL Reconstruction", "ACL Repair", "Revision ACL Reconstruction"]
                    },
                    {
                        "name": "Meniscus Tears",
                        "description": "Tears of the knee meniscus cartilage",
                        "procedures": ["Meniscus Repair", "Meniscal Transplant", "Root Repair"]
                    },
                    {
                        "name": "Cartilage Injuries",
                        "description": "Damage to knee articular cartilage",
                        "procedures": ["Cartilage Restoration", "Osteochondral Allograft", "MACI"]
                    },
                    {
                        "name": "Multiligament Knee Injuries",
                        "description": "Complex injuries involving multiple knee ligaments",
                        "procedures": ["Multiligament Reconstruction", "PCL Reconstruction"]
                    }
                ]
            },
            {
                "name": "Hip",
                "icon": "hip",
                "conditions": [
                    {
                        "name": "Hip Labral Tears",
                        "description": "Tears of the hip labrum",
                        "procedures": ["Hip Arthroscopy", "Labral Repair", "Labral Reconstruction"]
                    },
                    {
                        "name": "FAI (Femoroacetabular Impingement)",
                        "description": "Hip impingement syndrome",
                        "procedures": ["Hip Arthroscopy", "Cam/Pincer Resection"]
                    },
                    {
                        "name": "Hip Cartilage Damage",
                        "description": "Damage to hip articular cartilage",
                        "procedures": ["Microfracture", "Cartilage Restoration"]
                    },
                    {
                        "name": "Gluteal Tendon Tears",
                        "description": "Tears of the hip abductor tendons",
                        "procedures": ["Gluteal Tendon Repair", "Hip Arthroscopy"]
                    }
                ]
            }
        ]
    }
}

def slugify(text):
    """Convert text to slug."""
    return text.lower().replace(" ", "_").replace(".", "")

@router.get("/doctors", response_model=list[DoctorProfile])
async def list_doctors():
    """Get list of available doctors."""
    return [DoctorProfile(**doc) for doc in DOCTORS.values()]

@router.get("/doctors/{doctor_id}/procedures")
async def list_procedures(doctor_id: str):
    """Get procedures for a specific doctor."""
    if doctor_id not in DOCTORS:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor = DOCTORS[doctor_id]
    return [PROCEDURES[proc_id] for proc_id in doctor["procedures"] if proc_id in PROCEDURES]

@router.get("/doctors/{doctor_id}/specialties")
async def get_surgeon_specialties(doctor_id: str):
    """Get detailed conditions and procedures for a specific surgeon based on uploaded documents."""
    if doctor_id not in DOCTORS:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Dynamically build specialties from uploaded document collections
    try:
        c = retrieval.client()
        all_collections = c.get_collections().collections

        # Get list of doctors whose collections to search (including shared collections)
        doctors_to_search = [doctor_id]
        if doctor_id in SHARED_COLLECTIONS:
            doctors_to_search.extend(SHARED_COLLECTIONS[doctor_id])

        # Find all collections for this doctor and shared doctors
        doctor_collections = []
        for doc_id in doctors_to_search:
            doc_slug = slugify(doc_id)
            doctor_prefix = f"dr_{doc_slug}_"
            collections = [
                col.name for col in all_collections
                if col.name.startswith(doctor_prefix)
            ]
            doctor_collections.extend(collections)

        if not doctor_collections:
            return {"categories": []}

        # Map of procedure slugs to display names and descriptions
        PROCEDURE_INFO = {
            "ucl": {
                "name": "UCL Reconstruction (Tommy John Surgery)",
                "description": "Ulnar collateral ligament reconstruction for throwing athletes",
                "category": "Elbow",
                "icon": "elbow"
            },
            "acl": {
                "name": "ACL Reconstruction",
                "description": "Anterior cruciate ligament reconstruction surgery",
                "category": "Knee",
                "icon": "knee"
            },
            "rotator_cuff": {
                "name": "Rotator Cuff Repair",
                "description": "Surgical repair of torn rotator cuff tendons",
                "category": "Shoulder",
                "icon": "shoulder"
            },
            "meniscus": {
                "name": "Meniscus Surgery",
                "description": "Repair or removal of damaged meniscus cartilage",
                "category": "Knee",
                "icon": "knee"
            },
            "shoulder_instability": {
                "name": "Shoulder Instability Surgery",
                "description": "Surgical treatment for recurrent shoulder dislocations",
                "category": "Shoulder",
                "icon": "shoulder"
            },
            "labral": {
                "name": "Labral Repair",
                "description": "Surgical repair of labral tears (SLAP lesions)",
                "category": "Shoulder",
                "icon": "shoulder"
            },
            "tennis_elbow": {
                "name": "Tennis Elbow Treatment",
                "description": "Treatment for lateral epicondylitis",
                "category": "Elbow",
                "icon": "elbow"
            },
            "cartilage": {
                "name": "Cartilage Restoration",
                "description": "Procedures to repair or restore damaged cartilage",
                "category": "Knee",
                "icon": "knee"
            }
        }

        # Group procedures by category
        categories_map = {}

        for col_name in doctor_collections:
            # Extract procedure slug from collection name
            procedure_slug = col_name.replace(doctor_prefix, "")

            # Get procedure info or create default
            if procedure_slug in PROCEDURE_INFO:
                info = PROCEDURE_INFO[procedure_slug]
            else:
                # Create a readable name from the slug
                readable_name = procedure_slug.replace("_", " ").title()
                info = {
                    "name": readable_name,
                    "description": f"Information about {readable_name}",
                    "category": "General",
                    "icon": "medical"
                }

            category_name = info["category"]
            if category_name not in categories_map:
                categories_map[category_name] = {
                    "name": category_name,
                    "icon": info["icon"],
                    "conditions": []
                }

            categories_map[category_name]["conditions"].append({
                "name": info["name"],
                "description": info["description"],
                "procedures": [info["name"]]
            })

        # Convert to list and sort
        categories = list(categories_map.values())
        # Sort categories: Shoulder, Elbow, Knee, then others alphabetically
        category_order = {"Shoulder": 0, "Elbow": 1, "Knee": 2}
        categories.sort(key=lambda x: (category_order.get(x["name"], 99), x["name"]))

        return {"categories": categories}

    except Exception as e:
        logger.error("failed_to_get_specialties", error=str(e))
        # Fallback to hardcoded data if dynamic loading fails
        if doctor_id in SURGEON_SPECIALTIES:
            return SURGEON_SPECIALTIES[doctor_id]
        return {"categories": []}

@router.get("/doctors/with-documents")
async def list_doctors_with_documents():
    """Get all doctors with their associated document collections."""
    try:
        c = retrieval.client()
        all_collections = c.get_collections().collections
        all_collection_names = [col.name for col in all_collections]

        doctors_with_docs = []

        for doctor_id, doctor_info in DOCTORS.items():
            doc_slug = slugify(doctor_id)
            doctor_prefix = f"dr_{doc_slug}_"

            # Get doctor-specific collections
            doctor_collections = [
                name for name in all_collection_names
                if name.startswith(doctor_prefix)
            ]

            # Get collections from COLLECTION_PERMISSIONS
            permitted_collections = [
                col_name for col_name, permitted_doctors in COLLECTION_PERMISSIONS.items()
                if doctor_id in permitted_doctors
            ]

            # Get shared collections
            shared_doctor_collections = []
            if doctor_id in SHARED_COLLECTIONS:
                for shared_doc_id in SHARED_COLLECTIONS[doctor_id]:
                    shared_slug = slugify(shared_doc_id)
                    shared_prefix = f"dr_{shared_slug}_"
                    shared_collections = [
                        name for name in all_collection_names
                        if name.startswith(shared_prefix)
                    ]
                    shared_doctor_collections.extend(shared_collections)

            # Combine all collections and remove duplicates
            all_doctor_collections = list(set(
                doctor_collections + permitted_collections + shared_doctor_collections
            ))
            all_doctor_collections.sort()

            # Get collection info with point counts
            collection_details = []
            for col_name in all_doctor_collections:
                try:
                    col_info = c.get_collection(col_name)
                    collection_details.append({
                        "name": col_name,
                        "points_count": col_info.points_count,
                        "display_name": col_name.replace("dr_", "").replace("_", " ").title()
                    })
                except Exception as e:
                    logger.warning(f"Could not get info for collection {col_name}: {str(e)}")
                    collection_details.append({
                        "name": col_name,
                        "points_count": 0,
                        "display_name": col_name.replace("dr_", "").replace("_", " ").title(),
                        "error": str(e)
                    })

            doctors_with_docs.append({
                "id": doctor_id,
                "name": doctor_info["name"],
                "specialty": doctor_info["specialty"],
                "procedures": doctor_info["procedures"],
                "collections": collection_details,
                "total_collections": len(collection_details)
            })

        return {
            "total_doctors": len(doctors_with_docs),
            "doctors": doctors_with_docs
        }

    except Exception as e:
        logger.error("failed_to_list_doctors_with_documents", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve doctors with documents: {str(e)}")

@router.post("/query", response_model=Answer)
async def rag_query(body: QueryRequest):
    t0 = time.time()
    q = body.question.strip()

    # Guardrails
    ql = q.lower()
    if any(x in ql for x in ["chest pain", "shortness of breath", "suicid", "overdose"]):
        raise HTTPException(
            status_code=400, 
            detail="This service can't provide emergency advice. Call your local emergency number."
        )

    # Determine collection(s) to search
    doctor_name = None
    body_part_name = None
    collections_to_search = []

    if body.doctor_id:
        # Path 1: Specific Surgeon — search ALL of this doctor's collections
        doctor_slug = slugify(body.doctor_id)
        doctor_name = DOCTORS.get(body.doctor_id, {}).get("name", body.doctor_id)

        # Include shared doctors (e.g. Bedi also searches Dines' collections)
        doctors_to_search = [body.doctor_id]
        if body.doctor_id in SHARED_COLLECTIONS:
            doctors_to_search.extend(SHARED_COLLECTIONS[body.doctor_id])

        # Find every collection belonging to this doctor (and shared doctors)
        c = retrieval.client()
        all_collections = c.get_collections().collections
        for doc_id in doctors_to_search:
            doc_slug = slugify(doc_id)
            doctor_prefix = f"dr_{doc_slug}_"
            for col in all_collections:
                if col.name.startswith(doctor_prefix):
                    collections_to_search.append(col.name)

        # Add collections from COLLECTION_PERMISSIONS
        for collection_name, allowed_doctors in COLLECTION_PERMISSIONS.items():
            if body.doctor_id in allowed_doctors:
                collections_to_search.append(collection_name)

        logger.info("searching_doctor_collections", doctor=doctor_slug, shared_doctors=doctors_to_search, collections=collections_to_search)
    elif body.body_part:
        # CareGuide MSK Model: body part selected without specific doctor
        # Search general collections and body-part specific collections
        body_part_slug = slugify(body.body_part)
        body_part_name = body.body_part.title()

        c = retrieval.client()
        all_collections = c.get_collections().collections

        # Search for general collections related to this body part
        # This includes RCTs and clinical guidelines for the body part
        for col in all_collections:
            col_name = col.name
            # Include collections like: dr_general_ucl_rct, dr_general_shoulder, etc.
            if col_name.startswith("dr_general_"):
                matches = BODY_PART_COLLECTION_KEYWORDS.get(body_part_slug, [body_part_slug])
                for match in matches:
                    if match in col_name:
                        collections_to_search.append(col_name)
                        break

        logger.info("careguide_body_part_search", body_part=body_part_slug, collections=collections_to_search)
    else:
        # Fallback to demo collection
        collections_to_search = ["org_demo_chunks"]

    # Deduplicate collections while preserving order
    collections_to_search = list(dict.fromkeys(collections_to_search))

    # Search across all relevant collections and aggregate results
    all_hits = []
    hits_by_collection = {}
    for collection_name in collections_to_search:
        try:
            retrieval.ensure_collection(collection_name)
            hits = retrieval.search(q, top_k=8, collection_name=collection_name)
            hits_by_collection[collection_name] = len(hits)
            # Tag each hit with its source collection for debugging
            for h in hits:
                if h.payload is None:
                    h.payload = {}
                h.payload["_source_collection"] = collection_name
            all_hits.extend(hits)
        except Exception as e:
            logger.warning("collection_search_failed", collection=collection_name, error=str(e))

    # Sort by score and take top results
    all_hits.sort(key=lambda h: h.score, reverse=True)
    hits = all_hits[:8]

    # Log which collections contributed to the top results
    if hits:
        top_sources = [(h.payload or {}).get("_source_collection", "?") for h in hits]
        top_scores = [round(h.score, 4) for h in hits]
        logger.info("rag_top_hits", sources=top_sources, scores=top_scores, hits_per_collection=hits_by_collection)

    if not hits:
        if doctor_name:
            answer_text = f"I couldn't find specific protocols from {doctor_name}. Please contact the office for details."
        else:
            answer_text = "I couldn't find an approved orthopedic source for that. Please contact your clinic."
        citations = []
    else:
        context_parts = []
        citations = []
        
        for i, h in enumerate(hits[:6]):
            p = h.payload or {}
            text = p.get("text", "")
            title = p.get("title", "Unknown")
            doc_id = p.get("document_id", "unknown")
            page = p.get("page")
            section = p.get("section")
            author = p.get("author")
            publication_year = p.get("publication_year")

            context_parts.append(f"[Source {i+1}: {title}]\n{text}\n")

            if i < 4:
                # Generate presigned URL for document viewing
                document_url = None
                if doc_id and doc_id != "unknown" and doc_id.startswith("uploads/"):
                    try:
                        document_url = presign_get(doc_id, expiry_seconds=3600)  # 1 hour expiry
                    except Exception as e:
                        logger.warning("presign_url_failed", document_id=doc_id, error=str(e))

                citations.append(
                    Citation(
                        title=title,
                        document_id=doc_id,
                        page=page,
                        section=section,
                        author=author,
                        publication_year=publication_year,
                        document_url=document_url,
                    )
                )
        
        context = "\n".join(context_parts)
        
        if body.actor == "PROVIDER":
            if doctor_name:
                system_prompt = f"""You are a clinical assistant helping providers understand Dr. {doctor_name}'s protocols.

Guidelines:
- Provide evidence-based answers using ONLY the provided protocols
- Use appropriate medical terminology
- Include specific clinical details from Dr. {doctor_name}'s preferences
- When making specific claims or recommendations, cite the source using (Author Year) format if the author and publication year are evident in the source text, otherwise use (Source N) format
- Multiple citations should be formatted as (Author1 Year; Author2 Year) or (Source 1; Source 2)
- If protocols are unclear, acknowledge limitations
- Never fabricate information or citations"""
            elif body_part_name:
                system_prompt = f"""You are a clinical decision support assistant for {body_part_name} conditions. Provide evidence-based answers using ONLY the provided sources. When making specific claims, cite sources using (Author Year) format if evident in the text, otherwise use (Source N) format."""
            else:
                system_prompt = """You are a clinical decision support assistant. Provide evidence-based answers using ONLY the provided sources. When making specific claims, cite sources using (Author Year) format if evident in the text, otherwise use (Source N) format."""
        else:
            if doctor_name:
                system_prompt = f"""You are a patient education assistant explaining Dr. {doctor_name}'s treatment approaches.

Guidelines:
- Use clear, patient-friendly language
- Base answers strictly on Dr. {doctor_name}'s protocols
- When making specific points, reference the research by mentioning the lead author's last name and publication year if evident in the source (e.g., "Research by Smith in 2020 found that...")
- This helps patients understand the evidence behind recommendations
- Encourage patients to discuss specifics with their care team
- Never provide medical advice or fabricate information or citations"""
            elif body_part_name:
                system_prompt = f"""You are a patient education assistant for {body_part_name} conditions. Answer using ONLY the provided sources in clear language. When making specific points, reference the research by author and year if evident in the source text. Encourage patients to discuss specifics with their care team."""
            else:
                system_prompt = """You are a patient education assistant. Answer using ONLY the provided sources in clear language. When making specific points, reference the research by author and year if evident in the source text."""
        
        user_prompt = f"""Sources:
{context}

Question: {q}

Provide a helpful, accurate answer based solely on these sources."""

        # Use OpenAI
        oa = retrieval.openai_client()
        response = oa.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        answer_text = response.choices[0].message.content or "I couldn't generate an answer."

    latency_ms = int((time.time() - t0) * 1000)
    logger.info("rag_query", latency_ms=latency_ms, k=len(hits or []), collections=collections_to_search)
    return Answer(
        answer=answer_text, 
        citations=citations, 
        guardrails={"in_scope": True, "emergency": False}, 
        latency_ms=latency_ms
    )

@router.post("/dev/seed")
async def dev_seed():
    """Seed demo data."""
    retrieval.seed_demo()
    return {"status": "seeded"}

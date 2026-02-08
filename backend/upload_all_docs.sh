#!/bin/bash

# Batch upload all document sets
# Usage: ./upload_all_docs.sh /path/to/documents/

set -e  # Exit on error

# Check if documents directory is provided
if [ -z "$1" ]; then
    echo "Usage: ./upload_all_docs.sh /path/to/documents/"
    echo ""
    echo "Expected folder structure:"
    echo "  /path/to/documents/"
    echo "  ├── ucl_rct/"
    echo "  ├── rotator_cuff_rct/"
    echo "  ├── meniscus_rct/"
    echo "  ├── acl_rct/"
    echo "  ├── dines_protocols/"
    echo "  ├── hss_protocols/"
    echo "  ├── knee_lower_leg/"
    echo "  ├── foot_ankle/"
    echo "  ├── shoulder/"
    echo "  ├── elbow/"
    echo "  ├── hip_thigh/"
    echo "  ├── neck/"
    echo "  ├── back/"
    echo "  ├── aaos_knee_oa/"
    echo "  ├── Chahla Documents/     (with subfolders)"
    echo "  └── Bedi_CareGuide/       (with subfolders, Word docs supported)"
    exit 1
fi

DOCS_DIR="$1"

# Check if directory exists
if [ ! -d "$DOCS_DIR" ]; then
    echo "Error: Directory '$DOCS_DIR' does not exist"
    exit 1
fi

echo "========================================="
echo "📦 UPLOADING ALL DOCUMENT SETS"
echo "========================================="
echo "Documents directory: $DOCS_DIR"
echo ""

# Counter for tracking progress
TOTAL_SETS=17
CURRENT=0

# Function to upload a document set
upload_set() {
    CURRENT=$((CURRENT + 1))
    local folder=$1
    local doctor=$2
    local protocol=$3
    local source_type=$4
    local path="$DOCS_DIR/$folder"

    echo ""
    echo "========================================="
    echo "[$CURRENT/$TOTAL_SETS] Uploading: $protocol"
    echo "========================================="

    if [ ! -d "$path" ]; then
        echo "⚠️  Warning: Folder '$folder' not found, skipping..."
        return
    fi

    pdf_count=$(find "$path" -name "*.pdf" -o -name "*.PDF" | wc -l)
    if [ "$pdf_count" -eq 0 ]; then
        echo "⚠️  Warning: No PDF files found in '$folder', skipping..."
        return
    fi

    echo "📁 Found $pdf_count PDF file(s)"

    python batch_upload_docs.py \
        --doctor "$doctor" \
        --protocol "$protocol" \
        --directory "$path" \
        --source-type "$source_type" \
        --skip-errors

    echo "✅ Completed: $protocol"
}

# RCT Documents (precedence: 100)
echo ""
echo "================================================"
echo "📊 UPLOADING RCT DOCUMENTS (Precedence: 100)"
echo "================================================"

upload_set "ucl_rct" "General" "UCL_RCT" "RCT"
upload_set "rotator_cuff_rct" "General" "Rotator_Cuff_RCT" "RCT"
upload_set "meniscus_rct" "General" "Meniscus_RCT" "RCT"
upload_set "acl_rct" "General" "ACL_RCT" "RCT"

# AAOS Guidelines (precedence: 100)
echo ""
echo "================================================"
echo "📋 UPLOADING AAOS GUIDELINES (Precedence: 100)"
echo "================================================"

upload_set "aaos_knee_oa" "General" "AAOS_Knee_OA" "AAOS"

# Clinical Guidelines (precedence: 100)
echo ""
echo "================================================"
echo "🏥 UPLOADING CLINICAL GUIDELINES (Precedence: 100)"
echo "================================================"

upload_set "dines_protocols" "Joshua_Dines" "Clinic_Protocols" "CLINICAL_GUIDELINE"
upload_set "hss_protocols" "General" "HSS_Protocols" "CLINICAL_GUIDELINE"
upload_set "knee_lower_leg" "General" "Knee_Lower_Leg" "CLINICAL_GUIDELINE"
upload_set "foot_ankle" "General" "Foot_Ankle" "CLINICAL_GUIDELINE"
upload_set "shoulder" "General" "Shoulder" "CLINICAL_GUIDELINE"
upload_set "elbow" "General" "Elbow" "CLINICAL_GUIDELINE"
upload_set "hip_thigh" "General" "Hip_Thigh" "CLINICAL_GUIDELINE"
upload_set "neck" "General" "Neck" "CLINICAL_GUIDELINE"
upload_set "back" "General" "Back" "CLINICAL_GUIDELINE"

# Doctor-Specific Protocols (precedence: 95)
echo ""
echo "================================================"
echo "👨‍⚕️ UPLOADING DOCTOR-SPECIFIC PROTOCOLS (Precedence: 95)"
echo "================================================"

# Chahla Documents (has subfolders, use dedicated script)
CURRENT=$((CURRENT + 1))
echo ""
echo "========================================="
echo "[$CURRENT/$TOTAL_SETS] Uploading: Chahla Documents"
echo "========================================="

CHAHLA_DIR="$DOCS_DIR/Chahla Documents"
if [ -d "$CHAHLA_DIR" ]; then
    ./upload_chahla_docs.sh "$DOCS_DIR"
else
    echo "Warning: Folder 'Chahla Documents' not found, skipping..."
fi

# Bedi CareGuide Documents (has subfolders, use dedicated script)
CURRENT=$((CURRENT + 1))
echo ""
echo "========================================="
echo "[$CURRENT/$TOTAL_SETS] Uploading: Bedi CareGuide Documents"
echo "========================================="

BEDI_DIR="$DOCS_DIR/Bedi_CareGuide"
if [ -d "$BEDI_DIR" ]; then
    ./upload_bedi_docs.sh "$DOCS_DIR"
else
    echo "Warning: Folder 'Bedi_CareGuide' not found, skipping..."
fi

# DeFroda Protocol Documents (has subfolders, use dedicated script)
CURRENT=$((CURRENT + 1))
echo ""
echo "========================================="
echo "[$CURRENT/$TOTAL_SETS] Uploading: DeFroda Protocol Documents"
echo "========================================="

DEFRODA_DIR="$DOCS_DIR/DeFroda_Protocols"
if [ -d "$DEFRODA_DIR" ]; then
    ./upload_defroda_docs.sh "$DOCS_DIR"
else
    echo "Warning: Folder 'DeFroda_Protocols' not found, skipping..."
fi

# Final summary
echo ""
echo "========================================="
echo "🎉 ALL UPLOADS COMPLETE!"
echo "========================================="
echo "Total sets processed: $TOTAL_SETS"
echo ""
echo "Next steps:"
echo "1. Verify collections were created: curl http://localhost:6333/collections"
echo "2. Assign collections to surgeons in backend/app/routers/rag.py"
echo "3. Test queries in the frontend"
echo ""

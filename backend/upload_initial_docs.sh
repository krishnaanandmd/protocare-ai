#!/bin/bash

# Upload initial document sets from /Users/akris/Downloads/
# This script handles the first batch of 7 document sets

set -e  # Exit on error

DOCS_DIR="/Users/akris/Downloads"

echo "========================================="
echo "📦 UPLOADING INITIAL DOCUMENT SETS"
echo "========================================="
echo "Documents directory: $DOCS_DIR"
echo ""

# Counter for tracking progress
TOTAL_SETS=7
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
    echo "[$CURRENT/$TOTAL_SETS] Uploading: $folder"
    echo "========================================="

    if [ ! -d "$path" ]; then
        echo "❌ Error: Folder '$folder' not found at $path"
        echo "⚠️  Skipping..."
        return 1
    fi

    pdf_count=$(find "$path" -name "*.pdf" -o -name "*.PDF" 2>/dev/null | wc -l)
    if [ "$pdf_count" -eq 0 ]; then
        echo "⚠️  Warning: No PDF files found in '$folder', skipping..."
        return 1
    fi

    echo "📁 Found $pdf_count PDF file(s)"
    echo "🏷️  Source Type: $source_type"
    echo "👨‍⚕️  Doctor: $doctor"
    echo "📋 Protocol: $protocol"
    echo ""

    python batch_upload_docs.py \
        --doctor "$doctor" \
        --protocol "$protocol" \
        --directory "$path" \
        --source-type "$source_type" \
        --skip-errors

    echo "✅ Completed: $folder"
}

# RCT Documents (precedence: 100)
echo ""
echo "================================================"
echo "📊 UPLOADING RCT DOCUMENTS (Precedence: 100)"
echo "================================================"

upload_set "UCL RCT" "General" "UCL_RCT" "RCT"
upload_set "RotatorCuff RCT" "General" "Rotator_Cuff_RCT" "RCT"
upload_set "ACL RCT" "General" "ACL_RCT" "RCT"
upload_set "Meniscus RCT" "General" "Meniscus_RCT" "RCT"

# Clinical Guidelines (precedence: 100)
echo ""
echo "================================================"
echo "🏥 UPLOADING CLINICAL GUIDELINES (Precedence: 100)"
echo "================================================"

upload_set "Back" "General" "Back" "CLINICAL_GUIDELINE"
upload_set "Neck" "General" "Neck" "CLINICAL_GUIDELINE"
upload_set "Hip_and_Thigh" "General" "Hip_Thigh" "CLINICAL_GUIDELINE"

# Final summary
echo ""
echo "========================================="
echo "🎉 INITIAL UPLOAD COMPLETE!"
echo "========================================="
echo "Total sets processed: $TOTAL_SETS"
echo ""
echo "Collections created:"
echo "  - dr_general_ucl_rct"
echo "  - dr_general_rotator_cuff_rct"
echo "  - dr_general_acl_rct"
echo "  - dr_general_meniscus_rct"
echo "  - dr_general_back"
echo "  - dr_general_neck"
echo "  - dr_general_hip_thigh"
echo ""
echo "Next steps:"
echo "1. Verify collections: curl http://localhost:6333/collections | jq '.result.collections[].name'"
echo "2. Upload remaining document sets when ready"
echo "3. Assign collections to surgeons"
echo ""

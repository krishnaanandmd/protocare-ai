#!/bin/bash

# Upload additional document sets from /Users/akris/Downloads/
# This script handles: Foot_and_Ankle, AAOS_Knee_OA, Knee_LowerLeg, Shoulder

set -e  # Exit on error

DOCS_DIR="/Users/akris/Downloads"

echo "========================================="
echo "📦 UPLOADING ADDITIONAL DOCUMENT SETS"
echo "========================================="
echo "Documents directory: $DOCS_DIR"
echo ""

# Counter for tracking progress
TOTAL_SETS=4
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

# Clinical Guidelines (precedence: 100)
echo ""
echo "================================================"
echo "🏥 UPLOADING CLINICAL GUIDELINES (Precedence: 100)"
echo "================================================"

upload_set "Foot_and_Ankle" "General" "Foot_Ankle" "CLINICAL_GUIDELINE"
upload_set "Knee_LowerLeg" "General" "Knee_Lower_Leg" "CLINICAL_GUIDELINE"
upload_set "Shoulder" "General" "Shoulder" "CLINICAL_GUIDELINE"

# AAOS Guidelines (precedence: 100)
echo ""
echo "================================================"
echo "📋 UPLOADING AAOS GUIDELINES (Precedence: 100)"
echo "================================================"

upload_set "AAOS_Knee_OA" "General" "AAOS_Knee_OA" "AAOS"

# Final summary
echo ""
echo "========================================="
echo "🎉 UPLOAD COMPLETE!"
echo "========================================="
echo "Total sets processed: $TOTAL_SETS"
echo ""
echo "Collections created:"
echo "  - dr_general_foot_ankle"
echo "  - dr_general_knee_lower_leg"
echo "  - dr_general_shoulder"
echo "  - dr_general_aaos_knee_oa"
echo ""
echo "Next steps:"
echo "1. Verify collections: curl http://localhost:6333/collections | jq '.result.collections[].name'"
echo "2. Upload remaining document sets (Dines protocols, HSS, Elbow)"
echo "3. Test queries in frontend"
echo ""

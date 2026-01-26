#!/bin/bash

# Upload Chahla Documents
# Usage: ./upload_chahla_docs.sh /path/to/documents/
#
# Expected folder structure:
#   /path/to/documents/
#   └── Chahla Documents/
#       ├── subfolder1/
#       ├── subfolder2/
#       └── ...
#
# Each subfolder will be uploaded as a separate collection:
#   dr_jorge_chahla_{subfolder_slug}

set -e  # Exit on error

# Check if documents directory is provided
if [ -z "$1" ]; then
    echo "Usage: ./upload_chahla_docs.sh /path/to/documents/"
    echo ""
    echo "Expected folder structure:"
    echo "  /path/to/documents/"
    echo "  └── Chahla Documents/"
    echo "      ├── subfolder1/"
    echo "      ├── subfolder2/"
    echo "      └── ..."
    echo ""
    echo "Each subfolder will be uploaded as a separate collection."
    exit 1
fi

DOCS_DIR="$1"
CHAHLA_DIR="$DOCS_DIR/Chahla Documents"

# Check if directory exists
if [ ! -d "$CHAHLA_DIR" ]; then
    echo "Error: Directory '$CHAHLA_DIR' does not exist"
    echo ""
    echo "Please ensure the 'Chahla Documents' folder exists at: $DOCS_DIR"
    exit 1
fi

echo "========================================="
echo "📦 UPLOADING CHAHLA DOCUMENTS"
echo "========================================="
echo "Documents directory: $CHAHLA_DIR"
echo ""

# Find all subfolders
SUBFOLDERS=$(find "$CHAHLA_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

if [ -z "$SUBFOLDERS" ]; then
    echo "No subfolders found in '$CHAHLA_DIR'"
    echo ""
    echo "Checking for PDFs directly in the folder..."

    pdf_count=$(find "$CHAHLA_DIR" -maxdepth 1 -name "*.pdf" -o -name "*.PDF" | wc -l)
    if [ "$pdf_count" -eq 0 ]; then
        echo "No PDF files found. Nothing to upload."
        exit 0
    fi

    echo "Found $pdf_count PDF file(s) in root folder"
    echo "Uploading to collection: dr_jorge_chahla_protocols"

    python batch_upload_docs.py \
        --doctor "Jorge_Chahla" \
        --protocol "Protocols" \
        --directory "$CHAHLA_DIR" \
        --source-type DOCTOR_PROTOCOL \
        --skip-errors

    echo "✅ Upload complete!"
    exit 0
fi

# Count subfolders
TOTAL_FOLDERS=$(echo "$SUBFOLDERS" | wc -l)
CURRENT=0

echo "Found $TOTAL_FOLDERS subfolder(s) to process"
echo ""

# Function to convert folder name to protocol slug
to_slug() {
    echo "$1" | sed 's/ /_/g' | sed 's/[^a-zA-Z0-9_]//g' | tr '[:upper:]' '[:lower:]'
}

# Process each subfolder
for folder_path in $SUBFOLDERS; do
    CURRENT=$((CURRENT + 1))
    folder_name=$(basename "$folder_path")
    protocol_slug=$(to_slug "$folder_name")

    echo ""
    echo "========================================="
    echo "[$CURRENT/$TOTAL_FOLDERS] Processing: $folder_name"
    echo "========================================="

    # Count PDFs in this folder (recursively)
    pdf_count=$(find "$folder_path" -name "*.pdf" -o -name "*.PDF" | wc -l)

    if [ "$pdf_count" -eq 0 ]; then
        echo "⚠️  Warning: No PDF files found in '$folder_name', skipping..."
        continue
    fi

    echo "📁 Found $pdf_count PDF file(s)"
    echo "📌 Collection: dr_jorge_chahla_$protocol_slug"

    python batch_upload_docs.py \
        --doctor "Jorge_Chahla" \
        --protocol "$protocol_slug" \
        --directory "$folder_path" \
        --source-type DOCTOR_PROTOCOL \
        --skip-errors

    echo "✅ Completed: $folder_name"
done

# Final summary
echo ""
echo "========================================="
echo "🎉 CHAHLA DOCUMENTS UPLOAD COMPLETE!"
echo "========================================="
echo "Total folders processed: $TOTAL_FOLDERS"
echo ""
echo "Collections created (format: dr_jorge_chahla_{subfolder}):"
for folder_path in $SUBFOLDERS; do
    folder_name=$(basename "$folder_path")
    protocol_slug=$(to_slug "$folder_name")
    echo "  - dr_jorge_chahla_$protocol_slug"
done
echo ""
echo "Next steps:"
echo "1. Verify collections: curl http://localhost:6333/collections"
echo "2. Add new collections to COLLECTION_PERMISSIONS in backend/app/routers/rag.py"
echo "3. Test queries with Dr. Chahla's profile"
echo ""

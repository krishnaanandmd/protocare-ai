#!/bin/bash

# Upload DeFroda Documents
# Usage: ./upload_defroda_docs.sh /path/to/documents/
#
# Expected folder structure:
#   /path/to/documents/
#   └── DeFroda_Protocols/
#       ├── subfolder1/
#       ├── subfolder2/
#       └── ...
#
# Each subfolder will be uploaded as a separate collection:
#   dr_steven_defroda_{subfolder_slug}

set -e  # Exit on error

# Check if documents directory is provided
if [ -z "$1" ]; then
    echo "Usage: ./upload_defroda_docs.sh /path/to/documents/"
    echo ""
    echo "Expected folder structure:"
    echo "  /path/to/documents/"
    echo "  └── DeFroda_Protocols/"
    echo "      ├── subfolder1/"
    echo "      ├── subfolder2/"
    echo "      └── ..."
    echo ""
    echo "Each subfolder will be uploaded as a separate collection."
    exit 1
fi

DOCS_DIR="$1"
DEFRODA_DIR="$DOCS_DIR/DeFroda_Protocols"

# Check if directory exists
if [ ! -d "$DEFRODA_DIR" ]; then
    echo "Error: Directory '$DEFRODA_DIR' does not exist"
    echo ""
    echo "Please ensure the 'DeFroda_Protocols' folder exists at: $DOCS_DIR"
    exit 1
fi

echo "========================================="
echo "UPLOADING DEFRODA DOCUMENTS"
echo "========================================="
echo "Documents directory: $DEFRODA_DIR"
echo ""

# Find all subfolders
SUBFOLDERS=$(find "$DEFRODA_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

if [ -z "$SUBFOLDERS" ]; then
    echo "No subfolders found in '$DEFRODA_DIR'"
    echo ""
    echo "Checking for documents directly in the folder..."

    doc_count=$(find "$DEFRODA_DIR" -maxdepth 1 \( -name "*.pdf" -o -name "*.PDF" -o -name "*.docx" -o -name "*.DOCX" \) | wc -l)
    if [ "$doc_count" -eq 0 ]; then
        echo "No document files found. Nothing to upload."
        exit 0
    fi

    echo "Found $doc_count document file(s) in root folder"
    echo "Uploading to collection: dr_steven_defroda_protocols"

    python batch_upload_docs.py \
        --doctor "Steven_DeFroda" \
        --protocol "Protocols" \
        --directory "$DEFRODA_DIR" \
        --source-type DOCTOR_PROTOCOL \
        --skip-errors

    echo "Upload complete!"
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

    # Count documents in this folder (recursively) - both PDF and DOCX
    doc_count=$(find "$folder_path" \( -name "*.pdf" -o -name "*.PDF" -o -name "*.docx" -o -name "*.DOCX" \) | wc -l)

    if [ "$doc_count" -eq 0 ]; then
        echo "Warning: No document files found in '$folder_name', skipping..."
        continue
    fi

    echo "Found $doc_count document file(s)"
    echo "Collection: dr_steven_defroda_$protocol_slug"

    python batch_upload_docs.py \
        --doctor "Steven_DeFroda" \
        --protocol "$protocol_slug" \
        --directory "$folder_path" \
        --source-type DOCTOR_PROTOCOL \
        --skip-errors

    echo "Completed: $folder_name"
done

# Final summary
echo ""
echo "========================================="
echo "DEFRODA DOCUMENTS UPLOAD COMPLETE!"
echo "========================================="
echo "Total folders processed: $TOTAL_FOLDERS"
echo ""
echo "Collections created (format: dr_steven_defroda_{subfolder}):"
for folder_path in $SUBFOLDERS; do
    folder_name=$(basename "$folder_path")
    protocol_slug=$(to_slug "$folder_name")
    echo "  - dr_steven_defroda_$protocol_slug"
done
echo ""
echo "Next steps:"
echo "1. Verify collections: curl http://localhost:6333/collections"
echo "2. Add new collections to COLLECTION_PERMISSIONS in backend/app/routers/rag.py"
echo "3. Test queries with Dr. DeFroda's profile"
echo ""

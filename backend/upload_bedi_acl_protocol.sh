#!/bin/bash

# Upload Dr. Bedi's ACL Reconstruction + Meniscus Repair Protocol
#
# This script uploads Dr. Bedi's post-operative protocol for ACL reconstruction
# with meniscus repair to a dedicated collection: dr_asheesh_bedi_acl_meniscus
#
# Usage: ./upload_bedi_acl_protocol.sh /path/to/protocol.pdf
#
# The document will be:
#   1. Uploaded to S3 with original filename preserved
#   2. Indexed in Qdrant collection: dr_asheesh_bedi_acl_meniscus
#   3. Automatically accessible when querying Dr. Bedi's protocols
#   4. Properly titled based on document content or filename
#
# This protocol will be available to:
#   - Dr. Asheesh Bedi (automatically)
#   - Dr. Ayoosh Pareek (via COLLECTION_PERMISSIONS)
#   - Dr. Jorge Chahla (via COLLECTION_PERMISSIONS)

set -e

# Check if document path is provided
if [ -z "$1" ]; then
    echo "Usage: ./upload_bedi_acl_protocol.sh /path/to/protocol.pdf"
    echo ""
    echo "This script uploads Dr. Bedi's ACL + Meniscus Repair post-operative protocol."
    echo ""
    echo "The document will be indexed to collection: dr_asheesh_bedi_acl_meniscus"
    echo "It will automatically appear in search results when querying Dr. Bedi's protocols."
    echo ""
    echo "Doctors with access to this protocol:"
    echo "  - Dr. Asheesh Bedi (owner)"
    echo "  - Dr. Ayoosh Pareek (shared)"
    echo "  - Dr. Jorge Chahla (shared)"
    exit 1
fi

DOC_PATH="$1"

# Convert to absolute path if relative
if [[ "$DOC_PATH" != /* ]]; then
    DOC_PATH="$(pwd)/$DOC_PATH"
fi

# Check if file exists
if [ ! -f "$DOC_PATH" ]; then
    echo "Error: File not found: $DOC_PATH"
    exit 1
fi

# Get file extension
FILE_EXT="${DOC_PATH##*.}"
FILE_EXT_LOWER=$(echo "$FILE_EXT" | tr '[:upper:]' '[:lower:]')

# Validate file type
if [ "$FILE_EXT_LOWER" != "pdf" ] && [ "$FILE_EXT_LOWER" != "docx" ]; then
    echo "Error: Only PDF and DOCX files are supported"
    echo "  Found: $FILE_EXT"
    exit 1
fi

echo "========================================="
echo "UPLOADING DR. BEDI ACL PROTOCOL"
echo "========================================="
echo "Document: $DOC_PATH"
echo "Collection: dr_asheesh_bedi_acl_meniscus"
echo "Source Type: DOCTOR_PROTOCOL"
echo ""

# Upload using batch_upload_docs.py with single file mode
python batch_upload_docs.py \
    --doctor "Asheesh_Bedi" \
    --protocol "acl_meniscus" \
    --directory "$(dirname "$DOC_PATH")" \
    --file "$(basename "$DOC_PATH")" \
    --source-type DOCTOR_PROTOCOL

echo ""
echo "========================================="
echo "UPLOAD COMPLETE!"
echo "========================================="
echo ""
echo "The document has been uploaded to: dr_asheesh_bedi_acl_meniscus"
echo ""
echo "Doctors with access to this protocol:"
echo "  - Dr. Asheesh Bedi (owner)"
echo "  - Dr. Ayoosh Pareek (shared)"
echo "  - Dr. Jorge Chahla (shared)"
echo ""
echo "To verify the document was indexed:"
echo "  curl http://localhost:8000/documents/collections/dr_asheesh_bedi_acl_meniscus/documents"
echo ""
echo "To test a query:"
echo "  curl -X POST http://localhost:8000/rag/query \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"question\": \"ACL reconstruction meniscus repair weight bearing\", \"actor\": \"PROVIDER\", \"doctor_id\": \"asheesh_bedi\"}'"
echo ""

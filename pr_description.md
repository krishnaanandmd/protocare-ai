## Summary

Fixes the source citation display issue where citations were showing cryptic PDF filenames (like `777cf75079c0.pdf`) instead of meaningful source information.

This PR enhances the entire citation pipeline from ingestion to display:

### Backend Changes
- **Citation Schema**: Added `author` and `publication_year` fields to the Citation model
- **PDF Metadata Extraction**: Implemented intelligent extraction that:
  - Reads PDF metadata (title, author, dates) when available
  - Falls back to first-page content analysis using regex patterns
  - Extracts authors, publication years, and meaningful titles
  - Handles both well-formed and poorly-formatted PDFs
- **RAG Query Updates**: Enhanced to return new citation metadata fields

### Frontend Changes
- **Citation Display**: Updated to show "Author (Year)" format when available
- **Improved Layout**: Added author line between title and page info
- **Graceful Fallbacks**: Handles missing metadata elegantly

### Migration Support
- **Migration Script**: Added `migrate_citation_metadata.py` to update existing documents
  - Processes all documents in Qdrant collections
  - Downloads PDFs from S3 and extracts metadata
  - Updates vector chunks with new fields
  - Includes dry-run mode for safe testing
  - Skips already-migrated documents
- **Documentation**: Comprehensive README with usage instructions

## Example Output

**Before:**
```
Source 1: 777cf75079c0.pdf
Page 5
```

**After:**
```
Source 1: Management of Femoroacetabular Impingement
John Smith, MD (2020)
Page 5
```

## Test Plan

- [x] Schema changes compile successfully
- [x] Migration script syntax validated
- [ ] Test metadata extraction with sample PDFs
- [ ] Run dry-run migration on staging database
- [ ] Verify new document uploads capture metadata
- [ ] Test frontend display with various metadata combinations
- [ ] Run full migration on production (after staging validation)

## Migration Steps

After deployment:

1. **Test on staging first:**
   ```bash
   cd backend
   python -m app.scripts.migrate_citation_metadata --dry-run
   ```

2. **Migrate specific collection for validation:**
   ```bash
   python -m app.scripts.migrate_citation_metadata --collection <collection_name>
   ```

3. **Migrate all collections:**
   ```bash
   python -m app.scripts.migrate_citation_metadata
   ```

Expected time: ~2-5 seconds per document

## Files Changed

- `backend/app/models/schemas.py` - Citation model updates
- `backend/app/services/ingestion.py` - Metadata extraction logic
- `backend/app/routers/rag.py` - RAG query enhancements
- `frontend/app/[locale]/app/page.tsx` - Citation display improvements
- `backend/app/scripts/migrate_citation_metadata.py` - Migration script
- `backend/app/scripts/README.md` - Migration documentation

## Notes

- New documents will automatically have enhanced metadata
- Existing documents require running the migration script once
- Migration can be safely interrupted and resumed
- No data loss - original fields are preserved

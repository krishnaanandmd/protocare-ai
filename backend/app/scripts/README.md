# Migration Scripts

## Citation Metadata Migration

### Overview
The `migrate_citation_metadata.py` script updates existing documents in Qdrant to include enhanced citation metadata (author, publication year, and improved titles).

### Prerequisites
- Backend dependencies installed (`pip install -r requirements.txt`)
- Valid AWS S3 credentials configured
- Qdrant instance accessible
- Environment variables properly set (see `.env`)

### Usage

#### 1. Dry Run (Recommended First Step)
Test the migration without making any changes:

```bash
cd backend
python -m app.scripts.migrate_citation_metadata --dry-run
```

This will:
- Scan all collections
- Show what documents would be updated
- Display extracted metadata
- Make no actual changes to the database

#### 2. Migrate Specific Collection
To migrate only one collection:

```bash
python -m app.scripts.migrate_citation_metadata --collection dr_joshua_dines_ucl_repair
```

#### 3. Migrate All Collections
To migrate all collections at once:

```bash
python -m app.scripts.migrate_citation_metadata
```

### What the Script Does

1. **Scans Collections**: Iterates through all (or specified) Qdrant collections
2. **Groups by Document**: Groups vector chunks by their source document ID
3. **Extracts Metadata**:
   - Downloads PDFs from S3
   - Extracts title, author, and publication year using the same logic as the ingestion pipeline
   - Falls back to filename if metadata extraction fails
4. **Updates Points**: Updates all vector chunks for each document with the new metadata
5. **Skips Already Migrated**: Automatically skips documents that already have metadata

### Expected Output

```
2026-01-15 10:30:00 - INFO - Starting citation metadata migration
2026-01-15 10:30:00 - INFO - Qdrant URL: https://your-qdrant-instance
2026-01-15 10:30:00 - INFO - S3 Bucket: your-s3-bucket
2026-01-15 10:30:00 - INFO - Found 5 collection(s) to migrate

============================================================
Processing collection: dr_joshua_dines_ucl_repair
============================================================
2026-01-15 10:30:05 - INFO - Scanning collection for documents...
2026-01-15 10:30:10 - INFO - Found 12 unique documents across 156 points
2026-01-15 10:30:15 - INFO - Processing document: uploads/777cf75079c0.pdf
2026-01-15 10:30:18 - INFO - Extracted - Title: UCL Reconstruction Protocol, Author: John Smith MD, Year: 2020
2026-01-15 10:30:20 - INFO - ✓ Successfully updated 13 points for uploads/777cf75079c0.pdf
...

Migration complete for dr_joshua_dines_ucl_repair:
  Success: 12
  Errors: 0
  Skipped: 0

============================================================
FINAL SUMMARY
============================================================
Total documents updated: 48
Total errors: 0
Total skipped: 3
```

### Performance

- Processing time: ~2-5 seconds per document (depending on PDF size)
- For 100 documents: expect ~3-8 minutes total
- The script can be safely interrupted and rerun (skips already-migrated documents)

### Troubleshooting

#### Error: "Failed to download PDF"
- Check S3 credentials and permissions
- Verify the document_id paths are correct
- Ensure S3 bucket name is correct in settings

#### Error: "Connection timeout"
- Increase Qdrant timeout in the script
- Check network connectivity to Qdrant instance
- Verify Qdrant API key if using cloud instance

#### Partial Migration
If the script is interrupted:
- Simply rerun it - already-migrated documents will be skipped
- Use `--collection` to target specific collections that failed

### Post-Migration

After running the migration:
1. Test queries in the application to verify citations display correctly
2. Check a few documents manually to ensure metadata was extracted properly
3. New documents uploaded after the code update will automatically have metadata
4. No need to rerun migration for new documents

### Rollback

If you need to remove the metadata fields:
- The original data is preserved (no fields are removed)
- You can manually remove `author` and `publication_year` fields from Qdrant if needed
- Or simply update frontend to not display these fields

# Team Setup Guide - Document Upload

This guide will help team members set up their local environment to upload medical protocol documents to ProtoCare AI.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Getting Credentials](#getting-credentials)
- [Installing Dependencies](#installing-dependencies)
- [Uploading Documents](#uploading-documents)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

1. **Git** installed on your computer
   - macOS: `brew install git` or download from [git-scm.com](https://git-scm.com)
   - Windows: Download from [git-scm.com](https://git-scm.com)
   - Linux: `sudo apt-get install git` or `sudo yum install git`

2. **Python 3.9+** installed
   - Check version: `python --version` or `python3 --version`
   - Download from [python.org](https://www.python.org/downloads/) if needed

3. **Access to team credentials** (see [Getting Credentials](#getting-credentials))

---

## Initial Setup

### Step 1: Clone the Repository

Open your terminal (macOS/Linux) or Command Prompt/PowerShell (Windows) and run:

```bash
# Clone the repository
git clone https://github.com/krishnaanandmd/protocare-ai.git

# Navigate into the project
cd protocare-ai

# Switch to the document upload branch
git checkout claude/add-joshua-dines-pdfs-011CUhrrW9NDXwGjjTBkPRmT
```

### Step 2: Navigate to Backend Directory

```bash
cd backend
```

You should now be in the `protocare-ai/backend` directory.

---

## Getting Credentials

**⚠️ IMPORTANT: Never commit credentials to GitHub!**

### Request Credentials from Team Lead

You need a `.env` file with the following credentials. Contact your team lead to get these values:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-key-here

# Qdrant Vector Database
QDRANT_URL=https://your-qdrant-instance.cloud
QDRANT_API_KEY=your-qdrant-key-here
```

### Create Your .env File

1. In the `backend` directory, create a file named `.env`
2. Paste the credentials provided by your team lead
3. Save the file

**macOS/Linux:**
```bash
# Create the file
nano .env

# Paste credentials, then press Ctrl+X, Y, Enter to save
```

**Windows:**
```bash
# Create the file
notepad .env

# Paste credentials, then File → Save
```

### Verify .env File

```bash
# Check that the file exists
ls -la .env

# macOS/Linux: View contents (be careful not to share!)
cat .env

# Windows: View contents
type .env
```

---

## Installing Dependencies

### Step 1: Create a Virtual Environment (Recommended)

**macOS/Linux:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate
```

**Windows:**
```bash
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate
```

You should see `(venv)` at the beginning of your terminal prompt.

### Step 2: Install Required Packages

```bash
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt
```

### Step 3: Install OCR Support (Optional but Recommended)

For processing scanned PDFs:

**macOS:**
```bash
# Install Tesseract OCR
brew install tesseract

# Install Python OCR libraries
pip install pytesseract pdf2image pillow
```

**Ubuntu/Debian Linux:**
```bash
# Install Tesseract OCR
sudo apt-get update
sudo apt-get install tesseract-ocr poppler-utils

# Install Python OCR libraries
pip install pytesseract pdf2image pillow
```

**Windows:**
1. Download Tesseract from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install it (remember the installation path)
3. Install Python libraries:
   ```bash
   pip install pytesseract pdf2image pillow
   ```
4. Add Tesseract to your PATH or update your code with the path

---

## Uploading Documents

### Single Document Upload

To upload one PDF at a time:

```bash
python upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --file /path/to/your/document.pdf
```

**Example:**
```bash
python upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --file ~/Downloads/ucl_rehab_protocol.pdf
```

### Batch Document Upload

To upload multiple PDFs from a folder:

```bash
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory /path/to/folder/with/pdfs \
  --skip-errors
```

**Example:**
```bash
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory ~/Downloads/joshua_dines_ucl_protocols \
  --skip-errors
```

### Command Parameters Explained

- `--doctor`: The doctor's name (e.g., "Joshua Dines", "Kyle Kunze")
- `--protocol`: The protocol type (e.g., "UCL", "ACL", "MCL", "Rotator Cuff")
- `--file`: Path to a single PDF file (for single upload)
- `--directory`: Path to a folder containing PDFs (for batch upload)
- `--skip-errors`: Continue processing even if some files fail (optional, recommended for batch)

### What Happens During Upload

1. **Upload to S3**: PDFs are uploaded to Amazon S3 cloud storage
2. **Text Extraction**: Text is extracted from PDFs (with OCR for scanned documents)
3. **Processing**: Text is chunked and embedded for AI search
4. **Storage**: Embeddings are stored in Qdrant vector database
5. **Ready**: Documents are immediately available for AI queries

### Expected Output

For batch upload of 81 files, you should see:

```
📦 BATCH DOCUMENT UPLOAD
==========================================
🏥 Doctor: Joshua Dines
📋 Protocol: UCL (internal classification)
📁 Directory: /Users/you/Downloads/pdfs
🏷️  Collection: dr_joshua_dines_ucl
==========================================

🔍 Scanning for PDF files...
✅ Found 81 PDF files

--------------------------------------------------------------------------------
[1/81] Processing: protocol_week1.pdf
--------------------------------------------------------------------------------
📤 Uploading protocol_week1.pdf to S3...
✅ Uploaded to: s3://bucket/uploads/doctors/joshua_dines/ucl/abc123.pdf
⚙️  Processing document...
✅ SUCCESS: protocol_week1.pdf

[2/81] Processing: protocol_week2.pdf
...
[81/81] Processing: protocol_week24.pdf
✅ SUCCESS: protocol_week24.pdf

==========================================
📊 BATCH UPLOAD SUMMARY
==========================================
✅ Successful: 81
❌ Failed: 0
⏭️  Skipped: 0
📁 Total files: 81
🏷️  Collection: dr_joshua_dines_ucl
==========================================

🎉 All documents processed successfully!
```

---

## Troubleshooting

### Error: "can't open file 'batch_upload_docs.py'"

**Solution:** Make sure you're in the `backend` directory:
```bash
cd protocare-ai/backend
ls -la batch_upload_docs.py  # Should show the file
```

### Error: "No module named 'boto3'" or similar

**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

If still failing, make sure your virtual environment is activated (you should see `(venv)` in your prompt).

### Error: "Unable to locate credentials"

**Solution:** Check your `.env` file:
```bash
# Verify .env exists
ls -la .env

# Check contents (macOS/Linux)
cat .env

# Check contents (Windows)
type .env
```

Make sure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set correctly.

### Error: "PDF appears to be scanned but OCR is not available"

**Solution:** Install OCR support (see [Installing Dependencies](#step-3-install-ocr-support-optional-but-recommended))

### Error: "No such file or directory" for PDF path

**Solution:** Use the full path to your files:

**macOS/Linux:**
```bash
# Get full path
pwd  # Shows current directory
ls ~/Downloads  # List files in Downloads

# Use full path like:
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory /Users/your-username/Downloads/pdfs
```

**Windows:**
```bash
# Use full path like:
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory "C:\Users\YourName\Downloads\pdfs"
```

### Error: Permission denied

**macOS/Linux:**
```bash
# Make script executable
chmod +x batch_upload_docs.py
chmod +x upload_docs.py
```

### Script runs but no files found

**Solution:** Make sure:
1. PDFs are in the directory you specified
2. Files have `.pdf` or `.PDF` extension
3. You have read permissions for the files

```bash
# Check what's in your directory
ls /path/to/your/pdfs

# Look specifically for PDFs
ls /path/to/your/pdfs/*.pdf
```

### Upload is very slow

This is normal! Processing includes:
- Uploading to S3 (depends on file size and internet speed)
- OCR for scanned documents (can take 30-60 seconds per page)
- AI embeddings via OpenAI API
- Storing in vector database

For 81 documents, expect **30-60 minutes** total processing time.

### Some files failed

If you see errors for specific files:
1. Check if they're corrupted (try opening them)
2. Check if they're password-protected
3. Check if they're actually PDFs (not renamed images)
4. Use `--skip-errors` flag to continue with other files

---

## Getting Help

### Check Documentation
- **Document Upload Guide**: `DOCUMENT_UPLOAD.md`
- **This Setup Guide**: `TEAM_SETUP.md`

### Common Issues Checklist
- [ ] In the correct directory (`protocare-ai/backend`)
- [ ] Virtual environment activated (see `(venv)` in prompt)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file exists and has correct credentials
- [ ] Using correct file/directory paths
- [ ] PDF files are readable and not corrupted

### Contact Team Lead
If you're still stuck, contact your team lead with:
1. The exact command you ran
2. The complete error message
3. Your operating system (macOS, Windows, Linux)
4. Python version (`python --version`)

---

## Quick Reference

### Common Commands

```bash
# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Upload single file
python upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --file /path/to/file.pdf

# Upload multiple files
python batch_upload_docs.py \
  --doctor "Joshua Dines" \
  --protocol "UCL" \
  --directory /path/to/folder \
  --skip-errors

# Deactivate virtual environment when done
deactivate
```

### Supported Protocols
Common protocol types you can use:
- `UCL` - Ulnar Collateral Ligament
- `ACL` - Anterior Cruciate Ligament
- `MCL` - Medial Collateral Ligament
- `PCL` - Posterior Cruciate Ligament
- `Meniscus`
- `Rotator Cuff`
- `Labrum`
- `Achilles`
- Custom protocol names are also supported

### Supported Doctors
Any doctor name can be used. Current examples:
- `Joshua Dines`
- `Kyle Kunze`
- `Krishna Anand`

The system will automatically create organized collections like:
- `dr_joshua_dines_ucl`
- `dr_kyle_kunze_acl`
- etc.

---

## Security Best Practices

1. **Never commit .env to GitHub**
   - The `.gitignore` file should already exclude it
   - Double-check before committing: `git status`

2. **Keep credentials secure**
   - Don't share in Slack/email
   - Use secure password managers
   - Rotate keys periodically

3. **Don't share your .env file in screenshots**
   - Credentials can be visible in terminal

4. **Only upload authorized documents**
   - Ensure you have permission to upload medical documents
   - Follow HIPAA and data privacy regulations

---

## Next Steps

After successful setup:
1. Test with a single document upload first
2. Once confirmed working, proceed with batch uploads
3. Verify documents are queryable via the API/frontend
4. Keep your local repository updated: `git pull`

For detailed upload workflow and examples, see **DOCUMENT_UPLOAD.md**.

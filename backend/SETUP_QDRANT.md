# Qdrant Setup Guide

This guide walks you through setting up Qdrant vector database for ProtoCare AI.

## Step 1: Install Docker Desktop for Mac

### Download and Install

1. Go to [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)
2. Click "Download for Mac"
3. Choose the right version:
   - **Apple Silicon (M1/M2/M3)**: Download "Mac with Apple chip"
   - **Intel Mac**: Download "Mac with Intel chip"
4. Open the downloaded `.dmg` file
5. Drag Docker.app to your Applications folder
6. Open Docker from Applications
7. Follow the setup wizard (accept terms, choose settings)

### Verify Installation

Open Terminal and run:

```bash
docker --version
```

You should see something like: `Docker version 24.x.x`

```bash
docker ps
```

You should see an empty list (no containers running yet).

## Step 2: Start Qdrant

Once Docker Desktop is installed and running, start Qdrant:

```bash
cd /Users/akris/protocare-ai/backend
docker-compose up -d
```

This will:
- Download the Qdrant image (first time only, ~200MB)
- Start Qdrant in the background
- Create a `qdrant_storage` folder for data persistence

### Verify Qdrant is Running

Check the container is running:

```bash
docker ps
```

You should see a container named `protocare-qdrant`.

Test the API:

```bash
curl http://localhost:6333/collections
```

You should see: `{"result":{"collections":[]},"status":"ok","time":0.000...}`

## Step 3: Managing Qdrant

### Start Qdrant
```bash
cd /Users/akris/protocare-ai/backend
docker-compose up -d
```

### Stop Qdrant
```bash
cd /Users/akris/protocare-ai/backend
docker-compose down
```

### View Logs
```bash
docker-compose logs -f qdrant
```

### Restart Qdrant
```bash
docker-compose restart
```

### Check Status
```bash
docker-compose ps
```

## Step 4: Access Qdrant Dashboard (Optional)

Qdrant has a built-in web dashboard. Once running, open in your browser:

```
http://localhost:6333/dashboard
```

You can view collections, search vectors, and monitor performance.

## Troubleshooting

### Docker Desktop won't start
- Make sure you have admin privileges
- Check System Preferences > Security & Privacy for any blocks
- Restart your Mac

### Port 6333 already in use
Check what's using the port:
```bash
lsof -i :6333
```

Kill the process or change the port in `docker-compose.yml`:
```yaml
ports:
  - "6335:6333"  # Use 6335 instead
```

Then update `.env`:
```
QDRANT_URL=http://localhost:6335
```

### Container keeps restarting
View logs to see the error:
```bash
docker-compose logs qdrant
```

### Permission denied on qdrant_storage
```bash
sudo chmod -R 755 qdrant_storage/
```

### Clear all data and start fresh
```bash
docker-compose down
rm -rf qdrant_storage/
docker-compose up -d
```

## Data Persistence

All Qdrant data is stored in `backend/qdrant_storage/`. This folder:
- Persists between restarts
- Is in `.gitignore` (won't be committed to git)
- Can be backed up by copying the folder

To completely reset Qdrant:
```bash
docker-compose down
rm -rf qdrant_storage/
docker-compose up -d
```

## Next Steps

Once Qdrant is running, you can:
1. Upload documents using `./upload_initial_docs.sh`
2. Query the collections via the API
3. View collections in the dashboard at http://localhost:6333/dashboard

## Alternative: Qdrant Cloud (No Docker Needed)

If you prefer not to install Docker, you can use Qdrant Cloud:

1. Go to [cloud.qdrant.io](https://cloud.qdrant.io)
2. Sign up for free account
3. Create a cluster (free tier available)
4. Get your cluster URL and API key
5. Update `.env`:
   ```
   QDRANT_URL=https://your-cluster.qdrant.io
   QDRANT_API_KEY=your-api-key
   ```

No Docker installation needed with this option!

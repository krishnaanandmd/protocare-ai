from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.routers import rag, documents, questions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create question_logs table on startup (no-op if it already exists)
    init_db()
    yield

app = FastAPI(
    title="Clinical RAG API",
    version="0.1.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://care-guide.ai",
        "https://www.care-guide.ai",
        "https://*.vercel.app",  # For Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(rag.router, prefix="/rag", tags=["rag"])
app.include_router(questions.router, prefix="/rag/questions", tags=["questions"])

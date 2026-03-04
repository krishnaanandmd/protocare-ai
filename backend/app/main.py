from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.database import init_db
from app.routers import rag, documents, questions, demo_request, informed_consent


# ---------------------------------------------------------------------------
# Security headers middleware – adds headers that hospital firewalls and
# security scanners expect on every response from the API.
# ---------------------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        )
        response.headers["Cache-Control"] = "no-store"
        return response


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

# Security headers applied first (outermost middleware runs last, so add first)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://care-guide.ai",
        "https://www.care-guide.ai",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(rag.router, prefix="/rag", tags=["rag"])
app.include_router(questions.router, prefix="/rag/questions", tags=["questions"])
app.include_router(demo_request.router, prefix="/demo", tags=["demo"])
app.include_router(informed_consent.router, prefix="/consent", tags=["informed-consent"])

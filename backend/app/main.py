"""
RADIX Talent Match — Role 3: Candidate Profile Builder Backend
FastAPI server entry point.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.profiles import router as profiles_router
from app.database import is_database_connected

app = FastAPI(
    title="RADIX Talent Match — Profile Builder API",
    version="1.0.0",
    description="Python FastAPI backend for candidate profile validation, Supabase persistence, and downstream ingestion.",
)

# CORS Configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include profile routes
app.include_router(profiles_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Returns server status and Supabase connection state.
    """
    db_connected = is_database_connected()
    return {
        "status": "healthy",
        "service": "radix-profile-builder-api",
        "database": {
            "type": "supabase",
            "connected": db_connected,
            "mode": "live_supabase" if db_connected else "local_fallback",
        },
    }

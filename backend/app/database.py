"""
Database client initialization for Supabase.
Safely connects using SUPABASE_URL and SUPABASE_KEY from environment variables.
"""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
BACKEND_ENV_FILE = BACKEND_DIR / ".env"
REPOSITORY_ENV_FILE = BACKEND_DIR.parent / ".env"
load_dotenv(BACKEND_ENV_FILE if BACKEND_ENV_FILE.is_file() else REPOSITORY_ENV_FILE)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_supabase_client = None


def _has_supabase_credentials() -> bool:
    return bool(
        SUPABASE_URL
        and SUPABASE_KEY
        and "your-project.supabase.co" not in SUPABASE_URL
        and "your-supabase" not in SUPABASE_KEY
    )


def is_supabase_configured() -> bool:
    """Returns whether non-placeholder Supabase credentials are configured."""
    return _has_supabase_credentials()


def get_supabase_client():
    """
    Returns the initialized Supabase client if valid credentials exist.
    Returns None if credentials are missing or placeholder.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not _has_supabase_credentials():
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _supabase_client
    except Exception:
        return None


def get_database_status() -> dict:
    """Checks actual read access to candidate_profiles without changing data."""
    if not _has_supabase_credentials():
        return {
            "type": "supabase",
            "connected": False,
            "mode": "local_fallback",
            "error": "credentials_not_configured",
        }

    client = get_supabase_client()
    if client is None:
        return {
            "type": "supabase",
            "connected": False,
            "mode": "unavailable",
            "error": "client_initialization_failed",
        }

    try:
        client.table("candidate_profiles").select("id").limit(1).execute()
    except Exception as error:
        failure: dict[str, str | int] = {
            "reason": "candidate_profiles_read_failed",
            "exception": type(error).__name__,
        }
        status_code = getattr(error, "status_code", None)
        error_code = getattr(error, "code", None)
        if isinstance(status_code, int):
            failure["http_status"] = status_code
        if isinstance(error_code, str):
            failure["code"] = error_code
        return {
            "type": "supabase",
            "connected": False,
            "mode": "unavailable",
            "error": failure,
        }

    return {
        "type": "supabase",
        "connected": True,
        "mode": "live_supabase",
    }

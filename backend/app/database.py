"""
Database client initialization for Supabase.
Safely connects using SUPABASE_URL and SUPABASE_KEY from environment variables.
"""

import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_supabase_client = None


def get_supabase_client():
    """
    Returns the initialized Supabase client if valid credentials exist.
    Returns None if credentials are missing or placeholder.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    # Check for placeholder URLs
    if "your-project.supabase.co" in SUPABASE_URL or "your-supabase" in SUPABASE_KEY:
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _supabase_client
    except Exception as e:
        print(f"[Warning] Failed to initialize Supabase client: {e}")
        return None


def is_database_connected() -> bool:
    """Checks if a live connection to Supabase is configured."""
    client = get_supabase_client()
    return client is not None

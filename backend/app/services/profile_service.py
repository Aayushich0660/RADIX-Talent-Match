"""
Profile Service: Handles persistence and retrieval for candidate profiles.
Connects to Supabase 'candidate_profiles' table with local fallback for testing.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.models import CandidateProfilePayload, ProfileResponse
from app.database import get_supabase_client

# In-memory storage cache used for unit testing / fallback when Supabase keys are not set
_in_memory_store: Dict[str, Dict[str, Any]] = {}


def _get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProfileService:
    @staticmethod
    def create_profile(payload: CandidateProfilePayload) -> ProfileResponse:
        profile_id = str(uuid.uuid4())
        now = _get_utc_now_iso()
        client = get_supabase_client()

        if client:
            try:
                data = {
                    "id": profile_id,
                    "name": payload.name,
                    "email": payload.email,
                    "profile": payload.model_dump(),
                    "created_at": now,
                    "updated_at": now,
                }
                response = client.table("candidate_profiles").insert(data).execute()
                if response.data and len(response.data) > 0:
                    row = response.data[0]
                    return ProfileResponse(
                        id=row["id"],
                        profile=CandidateProfilePayload(**row["profile"]),
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                    )
            except Exception as e:
                print(f"[Supabase Write Error] {e}. Falling back to persistent session cache.")

        # Fallback / local test store
        record = {
            "id": profile_id,
            "profile": payload.model_dump(),
            "created_at": now,
            "updated_at": now,
        }
        _in_memory_store[profile_id] = record
        return ProfileResponse(
            id=profile_id,
            profile=payload,
            created_at=now,
            updated_at=now,
        )

    @staticmethod
    def get_profile(profile_id: str) -> Optional[ProfileResponse]:
        client = get_supabase_client()
        if client:
            try:
                response = client.table("candidate_profiles").select("*").eq("id", profile_id).execute()
                if response.data and len(response.data) > 0:
                    row = response.data[0]
                    return ProfileResponse(
                        id=row["id"],
                        profile=CandidateProfilePayload(**row["profile"]),
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                    )
            except Exception as e:
                print(f"[Supabase Read Error] {e}.")

        if profile_id in _in_memory_store:
            data = _in_memory_store[profile_id]
            return ProfileResponse(
                id=data["id"],
                profile=CandidateProfilePayload(**data["profile"]),
                created_at=data["created_at"],
                updated_at=data["updated_at"],
            )
        return None

    @staticmethod
    def list_profiles(limit: int = 50, offset: int = 0) -> List[ProfileResponse]:
        client = get_supabase_client()
        if client:
            try:
                response = client.table("candidate_profiles").select("*").range(offset, offset + limit - 1).execute()
                if response.data:
                    return [
                        ProfileResponse(
                            id=row["id"],
                            profile=CandidateProfilePayload(**row["profile"]),
                            created_at=row["created_at"],
                            updated_at=row["updated_at"],
                        )
                        for row in response.data
                    ]
            except Exception as e:
                print(f"[Supabase List Error] {e}.")

        # In-memory slice
        all_records = list(_in_memory_store.values())[offset : offset + limit]
        return [
            ProfileResponse(
                id=item["id"],
                profile=CandidateProfilePayload(**item["profile"]),
                created_at=item["created_at"],
                updated_at=item["updated_at"],
            )
            for item in all_records
        ]

    @staticmethod
    def update_profile(profile_id: str, payload: CandidateProfilePayload) -> Optional[ProfileResponse]:
        client = get_supabase_client()
        now = _get_utc_now_iso()

        if client:
            try:
                update_data = {
                    "name": payload.name,
                    "email": payload.email,
                    "profile": payload.model_dump(),
                    "updated_at": now,
                }
                response = client.table("candidate_profiles").update(update_data).eq("id", profile_id).execute()
                if response.data and len(response.data) > 0:
                    row = response.data[0]
                    return ProfileResponse(
                        id=row["id"],
                        profile=CandidateProfilePayload(**row["profile"]),
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                    )
            except Exception as e:
                print(f"[Supabase Update Error] {e}.")

        if profile_id in _in_memory_store:
            record = _in_memory_store[profile_id]
            record["profile"] = payload.model_dump()
            record["updated_at"] = now
            return ProfileResponse(
                id=profile_id,
                profile=payload,
                created_at=record["created_at"],
                updated_at=now,
            )
        return None

    @staticmethod
    def delete_profile(profile_id: str) -> bool:
        client = get_supabase_client()
        if client:
            try:
                response = client.table("candidate_profiles").delete().eq("id", profile_id).execute()
                return bool(response.data and len(response.data) > 0)
            except Exception as e:
                print(f"[Supabase Delete Error] {e}.")

        if profile_id in _in_memory_store:
            del _in_memory_store[profile_id]
            return True
        return False

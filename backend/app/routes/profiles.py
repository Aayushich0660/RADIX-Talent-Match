"""
FastAPI Routes for Candidate Profile CRUD operations.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query, status
from app.models import CandidateProfilePayload, ProfileResponse
from app.services.profile_service import ProfilePersistenceError, ProfileService

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])


@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(payload: CandidateProfilePayload):
    """
    Accepts candidate profile JSON, validates all fields, saves the profile,
    and returns the stored record with persistent UUID identifier.
    """
    try:
        saved = ProfileService.create_profile(payload)
        return saved
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(val_err))
    except ProfilePersistenceError as persistence_error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(persistence_error)) from persistence_error
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save profile: {str(e)}")


@router.get("", response_model=List[ProfileResponse])
def list_profiles(
    limit: int = Query(default=20, ge=1, le=100, description="Maximum profiles to return"),
    offset: int = Query(default=0, ge=0, description="Offset index for pagination"),
):
    """
    Retrieves saved candidate profiles with pagination.
    """
    try:
        return ProfileService.list_profiles(limit=limit, offset=offset)
    except ProfilePersistenceError as persistence_error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(persistence_error)) from persistence_error


@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: str):
    """
    Retrieves a single saved profile using its persistent UUID identifier.
    """
    try:
        profile = ProfileService.get_profile(profile_id)
    except ProfilePersistenceError as persistence_error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(persistence_error)) from persistence_error
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate profile with ID '{profile_id}' not found."
        )
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse)
def update_profile(profile_id: str, payload: CandidateProfilePayload):
    """
    Updates an existing candidate profile after validating incoming information.
    """
    try:
        updated = ProfileService.update_profile(profile_id, payload)
    except ProfilePersistenceError as persistence_error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(persistence_error)) from persistence_error
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate profile with ID '{profile_id}' not found."
        )
    return updated


@router.delete("/{profile_id}", status_code=status.HTTP_200_OK)
def delete_profile(profile_id: str):
    """
    Deletes a candidate profile.
    """
    try:
        success = ProfileService.delete_profile(profile_id)
    except ProfilePersistenceError as persistence_error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(persistence_error)) from persistence_error
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate profile with ID '{profile_id}' not found."
        )
    return {"message": f"Profile '{profile_id}' deleted successfully.", "id": profile_id}

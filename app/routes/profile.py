from fastapi import APIRouter, Depends, HTTPException, status
from app.services.profile_service import ProfileService
from app.dependencies.services import get_profile_service
from app.services.profile_service import ProfileService, get_current_user
from sqlalchemy.orm import Session
from app.db.db import get_db
from app.models.profile import Profile, ProfileInfo

router = APIRouter()

@router.get("/profile/info", response_model=ProfileInfo)
async def get_profile_info(
    auth_info: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service)
):
    """
    Get the profile information of the currently logged-in user
    """
    cognito_id = auth_info.get("sub")
    if not cognito_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = profile_service.db.query(Profile).filter(Profile.UserID == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return ProfileInfo(
        UserID=profile.UserID,
        Username=profile.Username,
        Email=profile.Email,
        NumberOfRating=profile.NumberOfRating,
        CurrentRating=profile.CurrentRating,
        CognitoUserID=profile.CognitoUserID
    )

@router.get("/profile/{username}", response_model=ProfileInfo)
async def get_profile_by_username(
    username: str,
    profile_service: ProfileService = Depends(get_profile_service)
):
    """
    Get profile information by username
    """
    profile = profile_service.get_profile_username(username)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return ProfileInfo(
        UserID=profile.UserID,
        Username=profile.Username,
        Email=profile.Email,
        NumberOfRating=profile.NumberOfRating,
        CurrentRating=profile.CurrentRating,
        CognitoUserID=profile.CognitoUserID
    ) 
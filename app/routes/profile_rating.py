import logging
from fastapi import APIRouter, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from app.services.profile_service import ProfileService, get_current_user
from app.dependencies.services import get_profile_service
from app.dependencies.auth import req_user_role
from app.db.db import get_db

router = APIRouter()

@router.put("/rate-seller", response_model=dict, dependencies=[Depends(req_user_role)])
def rate_seller(
    auction_id: int = Form(...),
    rating: int = Form(...),
    auth_info: dict = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db)
):
    logging.info(f"Received request to rate seller for auction_id: {auction_id}, rating: {rating}")
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        seller_profile = profile_service.rate_seller(user_id, auction_id, rating)
        return {"message": "Seller rated successfully", "seller_profile": seller_profile}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
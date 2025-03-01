#!/usr/bin/env python3

from fastapi import APIRouter, Form, File, UploadFile, HTTPException, status, Depends
from app.models.auction import AuctionResponse, AuctionInfo
from app.models.profile import ProfileInfo, ProfileResponse
from app.services.auction_service import AuctionService
from app.services.profile_service import ProfileService, get_current_user
from app.dependencies.services import get_auction_service, get_profile_service
from app.dependencies.auth import req_user_role
from sqlalchemy.orm import Session
from app.db.db import get_db
from pydantic import ValidationError
import os  # Import the os module
from typing import List

router = APIRouter()

# Get the base directory one level up from where seller_submission.py is located
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Correct directories based on new folder structure
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
IMAGE_DIR = os.path.join(STATIC_DIR, "images")

# Ensure directories exist
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)
os.makedirs(IMAGE_DIR, exist_ok=True)

'''To handle file uploads and form form data.'''
@router.post("/submit-auction", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED, 
             dependencies=[Depends(req_user_role)])
def create_auction(
    file: UploadFile = File(...),
    card_name: str = Form(...),
    card_quality: str = Form(...),
    is_validated: bool = Form(...),
    starting_bid: float = Form(...),
    minimum_increment: float = Form(...),
    auction_duration: float = Form(...),
    service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        auction_data = service.create_auction(file, card_name, card_quality, is_validated, starting_bid, minimum_increment, auction_duration, user_id)
        return {
            "AuctionID": auction_data.AuctionID,
            "CardID": auction_data.CardID,
            "CardName": auction_data.CardName,
            "SellerID": auction_data.SellerID,
            "MinimumIncrement": auction_data.MinimumIncrement,
            "EndTime": auction_data.EndTime,
            "Status": auction_data.Status,
            "HighestBidderID": auction_data.HighestBidderID,
            "HighestBid": auction_data.HighestBid,
            "ImageURL": auction_data.ImageURL
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Response validation error: {e.errors()}")

@router.get("/my-auctions", response_model=List[int], dependencies=[Depends(req_user_role)])
def get_my_auctions(
    auth_info: dict = Depends(get_current_user),
    service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db)
):
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        auctions = service.get_auctions_by_seller(user_id)
        auction_ids = [auction.AuctionID for auction in auctions]
        return auction_ids
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-auction/{auction_id}", response_model=AuctionResponse, dependencies=[Depends(req_user_role)])
def update_auction(
    auction_id: int,
    file: UploadFile = File(...),
    card_name: str = Form(...),
    card_quality: str = Form(...),
    is_validated: bool = Form(...),
    starting_bid: float = Form(...),
    minimum_increment: float = Form(...),
    auction_duration: float = Form(...),
    auth_info: dict = Depends(get_current_user),
    service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db)
):
    cognito_id = auth_info.get("sub")
    try:
        updated_auction = service.update_auction(auction_id, cognito_id, file, card_name, card_quality, is_validated, starting_bid, minimum_increment, auction_duration, profile_service)
        if not updated_auction:
            raise HTTPException(status_code=404, detail="Auction not found or you do not have permission to update this auction")
        return updated_auction
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


'''
Temporary endpoint to delete all auctions
'''

@router.delete("/delete-all-auctions-do-not-use", dependencies=[Depends(req_user_role)])
def delete_all_auctions(
    service: AuctionService = Depends(get_auction_service),
    db: Session = Depends(get_db)
):
    try:
        result = service.delete_all_auctions()
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
#!/usr/bin/env python3

from fastapi import APIRouter, Form, File, UploadFile, HTTPException, status, Depends
from app.models.auction import AuctionResponse, AuctionInfo
from app.models.profile import ProfileInfo, ProfileResponse
from app.models.card import Card, CardResponse  # Import CardResponse model
from app.services.auction_service import AuctionService
<<<<<<< HEAD
from app.dependencies.services import get_auction_service
from app.dependencies.auth import req_user_role #Add this
from starlette.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
import shutil
import os
import uuid
import logging
from sqlalchemy.orm import Session
from app.db.db import get_db
from pydantic import ValidationError
# import pandas as pd

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


# pokemon_file =pd.read_csv(r"C:\Users\shuji\OneDrive\Desktop\School\Modern Software Sln\Project\pokemon-cards.csv")
# url_list = pokemon_file['image_url'].tolist()
url_used = set()
# name_list = pokemon_file['name'].tolist()
name_used = set()


'''To handle file uploads and form form data.'''
@router.post("/submit-auction", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED,
dependencies=[Depends(req_user_role)]) # Add this
=======
from app.services.card_service import CardService
from app.services.profile_service import ProfileService, get_current_user
from app.dependencies.services import get_auction_service, get_profile_service, get_card_service
from app.dependencies.auth import req_user_role
from sqlalchemy.orm import Session
from app.db.db import get_db
from pydantic import ValidationError
import os  # Import the os module
from typing import List

router = APIRouter()

'''To handle file uploads and form form data.'''

@router.get("/validated-cards", response_model=List[CardResponse], dependencies=[Depends(req_user_role)])
def get_validated_cards(
    auth_info: dict = Depends(get_current_user),
    card_service: CardService = Depends(get_card_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db)
):
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        validated_cards = card_service.get_validated_cards_by_user_id(user_id)
        return validated_cards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit-auction", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED, 
             dependencies=[Depends(req_user_role)])
>>>>>>> 880760880a492f5f11a99f9c9597bdd2da84e4bb
def create_auction(
    card_id: int = Form(...),
    starting_bid: float = Form(...),
    minimum_increment: float = Form(...),
    auction_duration: float = Form(...),
    service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
<<<<<<< HEAD
        
    '''Generate a unique filename using UUID to ensure no conflict in filenames'''
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(IMAGE_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logging.debug(f"File saved successfully to: {file_path}")
    except Exception as e:
        logging.error(f"Failed to save file: {str(e)}")
        print("500 was raised")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    #adding dummy card name tp the database
    for i in range(len(name_list)):
        if name_list[i] not in name_used:
            card_name = name_list[i]
            name_used.add(card_name)

    '''Create card record'''
    card = Card(CardName=card_name,
                CardQuality=card_quality,
                OwnerID=1, # Dummy owner ID for now
                IsValidated=is_validated)
    db.add(card)
    db.commit()
    db.refresh(card)

    '''Calculate the end time of the auction'''
    end_time = datetime.now() + timedelta(hours=auction_duration)

    # Validate the end time
    if end_time <= datetime.now():
        raise HTTPException(status_code=400, detail="End Time must be later than the current time!")

    # Validate the starting bid
    if starting_bid <= 0:
        raise HTTPException(status_code=400, detail="Starting bid must be greater than zero!")

    # Validate the minimum increment
    if minimum_increment <= 0:
        raise HTTPException(status_code=400, detail="Minimum increment must be greater than zero!")

    #dummy values to input for url for now until we get the actual url
    for i in range(len(url_list)):
        if url_list[i] not in url_used:
            file_path = url_list[i]
            url_used.add(url_list[i])
            break

    '''Create auction record'''
    auction_data = Auction(
        CardID=card.CardID,
        CardName=card_name,
        SellerID=card.OwnerID,
        MinimumIncrement=minimum_increment,
        EndTime=end_time,
        Status="In Progress", # Dummy status for now
        HighestBidderID=2, # Dummy bidder ID for now
        HighestBid=starting_bid, # Dummy starting bid for now. Should replace when the auction page comes in.
        ImageURL=f"{file_path}"
    )

    db.add(auction_data)
    db.commit()
    db.refresh(auction_data)
    
=======
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

>>>>>>> 880760880a492f5f11a99f9c9597bdd2da84e4bb
    try:
        auction_data = service.create_auction(user_id, card_id, starting_bid, minimum_increment, auction_duration)
        card = db.query(Card).filter(Card.CardID == card_id).first()
        return {
            "AuctionID": auction_data.AuctionID,
            "CardID": auction_data.CardID,
            "SellerID": auction_data.SellerID,
            "MinimumIncrement": auction_data.MinimumIncrement,
            "EndTime": auction_data.EndTime,
            "Status": auction_data.Status,
            "HighestBidderID": auction_data.HighestBidderID,
            "HighestBid": auction_data.HighestBid,
            "ImageURL": card.ImageURL  # Use the ImageURL from the card
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Response validation error: {e.errors()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    minimum_increment: float = Form(...),
    starting_bid: float = Form(...),
    auction_duration: float = Form(...),
    auth_info: dict = Depends(get_current_user),
    service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db)
):
    cognito_id = auth_info.get("sub")
    try:
        updated_auction = service.update_auction(auction_id, cognito_id, minimum_increment, starting_bid, auction_duration, profile_service)
        if not updated_auction:
            raise HTTPException(status_code=404, detail="Auction not found or you do not have permission to update this auction")
        return updated_auction
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-auction/{auction_id}", dependencies=[Depends(req_user_role)])
def delete_auction(
    auction_id: int,
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
        result = service.delete_auction(auction_id, user_id)
        return result
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
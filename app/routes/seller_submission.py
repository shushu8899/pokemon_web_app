#!/usr/bin/env python3

from fastapi import APIRouter, Form, File, UploadFile, HTTPException, status, Depends
from app.models.auction import AuctionResponse, AuctionInfo
from app.models.profile import ProfileInfo, ProfileResponse
from app.models.card import Card, CardResponse  # Import CardResponse model
from app.services.auction_service import AuctionService
from app.services.card_service import CardService
from app.services.profile_service import ProfileService, get_current_user
from app.dependencies.services import get_auction_service, get_profile_service, get_card_service
from app.dependencies.auth import req_user_role
from sqlalchemy.orm import Session
from app.db.db import get_db
from pydantic import ValidationError
import os  # Import the os module
from typing import List
from datetime import datetime
from pydantic import BaseModel

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
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

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

class AuctionWithCardDetails(BaseModel):
    AuctionID: int
    SellerID: int
    CardID: int
    StartingBid: float
    MinimumIncrement: float
    EndTime: datetime
    Status: str
    HighestBidderID: int | None
    HighestBid: float
    # Card details
    CardName: str
    CardQuality: str
    ImageURL: str | None
    IsValidated: bool

@router.get("/my-auctions", response_model=List[AuctionWithCardDetails], dependencies=[Depends(req_user_role)])
def get_my_auctions(
    auth_info: dict = Depends(get_current_user),
    service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db)
):
    """
    Get all auctions created by the current user, including card details
    """
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        auctions = service.get_auctions_by_seller(user_id)
        result = []
        current_time = datetime.utcnow()
        
        for auction in auctions:
            # Update status if auction has ended
            if auction.EndTime < current_time and auction.Status != "Closed":
                auction.Status = "Closed"
                db.commit()

            # Get card details for this auction
            card = db.query(Card).filter(Card.CardID == auction.CardID).first()
            if card:
                result.append(AuctionWithCardDetails(
                    AuctionID=auction.AuctionID,
                    SellerID=auction.SellerID,
                    CardID=auction.CardID,
                    StartingBid=auction.HighestBid,  # Set StartingBid equal to HighestBid
                    MinimumIncrement=auction.MinimumIncrement,
                    EndTime=auction.EndTime,
                    Status=auction.Status,
                    HighestBidderID=auction.HighestBidderID,
                    HighestBid=auction.HighestBid,
                    # Card details
                    CardName=card.CardName,
                    CardQuality=card.CardQuality,
                    ImageURL=card.ImageURL,
                    IsValidated=card.IsValidated
                ))
        
        return result
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
    """
    Update an auction's details. 
    Conditions for updating an auction:
    - The auction must not be closed
    - There must not be any bids yet (no highest bidder)
    - The user must be the seller of the auction
    - If there's no highest bidder, the highest_bid will be set equal to the starting_bid
    """
    cognito_id = auth_info.get("sub")
    try:
        # Get the auction first to check if it exists and if there's a highest bidder
        auction = service.get_auction_by_id(auction_id)
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")

        # Check if the auction is closed before attempting to update
        if auction.Status == "Closed":
            raise HTTPException(status_code=403, detail="Cannot update a closed auction")

        # Update the auction with the new values
        updated_auction = service.update_auction(
            auction_id=auction_id,
            cognito_user_id=cognito_id,
            minimum_increment=minimum_increment,
            starting_bid=starting_bid,
            auction_duration=auction_duration,
            profile_service=profile_service
        )
        
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


@router.get("/auction-details/{auction_id}", response_model=AuctionWithCardDetails, dependencies=[Depends(req_user_role)])
def get_auction_details(
    auction_id: int,
    auth_info: dict = Depends(get_current_user),
    service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific auction, including card details
    """
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # Get the auction
        auction = service.get_auction_by_id(auction_id)
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")
        
        # Verify that the user is the seller of this auction
        if auction.SellerID != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to view this auction's details")

        # Get card details
        card = db.query(Card).filter(Card.CardID == auction.CardID).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        return AuctionWithCardDetails(
            AuctionID=auction.AuctionID,
            SellerID=auction.SellerID,
            CardID=auction.CardID,
            StartingBid=auction.HighestBid,
            MinimumIncrement=auction.MinimumIncrement,
            EndTime=auction.EndTime,
            Status=auction.Status,
            HighestBidderID=auction.HighestBidderID,
            HighestBid=auction.HighestBid,
            CardName=card.CardName,
            CardQuality=card.CardQuality,
            ImageURL=card.ImageURL,
            IsValidated=card.IsValidated
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
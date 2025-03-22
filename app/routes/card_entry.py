from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
import os
import shutil
import uuid
from sqlalchemy.orm import Session
from app.models.card import Card
from app.models.profile import Profile
from app.db.db import get_db
from app.dependencies.auth import req_user_or_admin
from app.services.profile_service import get_current_user
from typing import List
from datetime import datetime, timezone
from app.models.notifications import Notification
from app.services.websocket_manager import websocket_manager
from sqlalchemy.exc import SQLAlchemyError
import json

router = APIRouter()

UPLOAD_DIR = "static/uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Ensure upload directory exists

@router.post("/card-entry/create", dependencies=[Depends(req_user_or_admin)])
async def create_card_entry(
    card_name: str = Form(...),
    card_quality: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Users (admins and regular users) can create a Pokémon card entry with details.
    """
    cognito_user_id = auth_info.get("sub")

    # Retrieve the user_id from the profiles table based on the cognito_user_id
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    # Check if card already exists for this user
    existing_card = db.query(Card).filter(Card.CardName.ilike(card_name), Card.OwnerID == owner_id).first()
    if existing_card:
        raise HTTPException(status_code=400, detail="Card already exists for this user")

    # Generate a unique filename for the image
    unique_filename = f"{uuid.uuid4()}_{image.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save Image to Upload Directory
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    image_url = f"/static/uploads/{unique_filename}"

    # Create a new card entry
    new_card = Card(
        OwnerID=owner_id,
        CardName=card_name,
        CardQuality=card_quality,
        IsValidated=False,
        ImageURL=image_url
    )

    db.add(new_card)
    db.commit()
    db.refresh(new_card)

    # Add notification
    try:
        message = f"Card '{card_name}' uploaded successfully."
        new_notification = Notification(
            ReceiverID=owner_id,
            AuctionID=None,
            Message=message,
            IsRead=False,
        )
        db.add(new_notification)
        db.commit()
        print("✅ Notification created successfully")

        # ✅ Send real-time WebSocket notification
        await websocket_manager.send_notification(
            user_profile.Email,
            {
                "notification_id": new_notification.NotificationID,
                "auction_id": new_notification.AuctionID,
                "message": new_notification.Message,
                "sent_date": new_notification.TimeSent.isoformat(),
                "is_read": False
            }
        )

    except SQLAlchemyError as e:
        db.rollback()
        print("❌ SQLAlchemy error when adding notification:", e)
        raise HTTPException(status_code=500, detail="Notification insert failed")
    except Exception as e:
        print("⚠️ Error sending WebSocket notification:", e)

    return {
        "message": "Card entry successful",
        "card_id": new_card.CardID,
        "image_url": image_url
    }


@router.put("/card-entry/update", dependencies=[Depends(req_user_or_admin)])
async def update_card_entry(
    card_id: int = Form(...),
    card_name: str = Form(...),
    card_quality: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Users (admins and regular users) can update a Pokémon card entry with details.
    Image upload is optional during update.
    """
    cognito_user_id = auth_info.get("sub")

    # Retrieve the user_id from the profiles table based on the cognito_user_id
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    # Retrieve the existing card
    existing_card = db.query(Card).filter(Card.CardID == card_id, Card.OwnerID == owner_id).first()
    if not existing_card:
        raise HTTPException(status_code=404, detail="Card not found for this user")

    # Update image only if a new one is provided
    if image:
        # Generate a unique filename for the image
        unique_filename = f"{uuid.uuid4()}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save Image to Upload Directory
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Delete old image if it exists
        if existing_card.ImageURL and existing_card.ImageURL.startswith("/static/uploads/"):
            old_image_path = os.path.join("static", "uploads", os.path.basename(existing_card.ImageURL))
            try:
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
            except Exception as e:
                print(f"Error deleting old image file: {e}")

        existing_card.ImageURL = f"/static/uploads/{unique_filename}"

    # Update the card details
    existing_card.CardName = card_name
    existing_card.CardQuality = card_quality
    existing_card.IsValidated = False  # Reset validation status when card is updated
    db.commit()
    db.refresh(existing_card)

    return {
        "message": "Card updated successfully",
        "card_id": existing_card.CardID,
        "updated_image_url": existing_card.ImageURL,
        "is_validated": existing_card.IsValidated
    }

@router.get("/my-cards", dependencies=[Depends(req_user_or_admin)])
async def get_my_cards(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=10, ge=1, le=100, description="Number of cards per page"),
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Get all cards owned by the currently logged-in user with pagination support.
    
    Parameters:
    - page: The page number (starts from 1)
    - limit: Number of cards per page (default: 10, max: 100)
    """
    cognito_user_id = auth_info.get("sub")

    # Retrieve the user_id from the profiles table based on the cognito_user_id
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    # Calculate offset
    offset = (page - 1) * limit

    # Get total count of user's cards
    total_cards = db.query(Card).filter(Card.OwnerID == owner_id).count()

    # Get paginated cards
    user_cards = db.query(Card).filter(Card.OwnerID == owner_id).offset(offset).limit(limit).all()

    # Calculate total pages
    total_pages = (total_cards + limit - 1) // limit

    # Format the response
    return {
        "cards": [
            {
                "card_id": card.CardID,
                "card_name": card.CardName,
                "card_quality": card.CardQuality,
                "is_validated": card.IsValidated,
                "image_url": card.ImageURL
            }
            for card in user_cards
        ],
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_cards": total_cards,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    }

@router.get("/card-entry/unvalidated", dependencies=[Depends(req_user_or_admin)])
async def get_unvalidated_cards(
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Get all unvalidated cards (IsValidated = False) owned by the currently logged-in user.
    """
    cognito_user_id = auth_info.get("sub")

    # Retrieve the user_id from the profiles table based on the cognito_user_id
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    # Get all unvalidated cards for the user
    unvalidated_cards = db.query(Card).filter(
        Card.OwnerID == owner_id,
        Card.IsValidated == False
    ).all()

    return [
        {
            "CardID": card.CardID,
            "CardName": card.CardName,
            "CardQuality": card.CardQuality,
            "ImageURL": card.ImageURL,
            "IsValidated": card.IsValidated,
            "OwnerID": card.OwnerID
        }
        for card in unvalidated_cards
    ]

@router.get("/card-entry/{card_id}", dependencies=[Depends(req_user_or_admin)])
async def get_card_details(
    card_id: int,
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Get details of a specific card. Users can only view their own cards.
    """
    cognito_user_id = auth_info.get("sub")

    # Retrieve the user_id from the profiles table based on the cognito_user_id
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    # Retrieve the card
    card = db.query(Card).filter(Card.CardID == card_id, Card.OwnerID == owner_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or you don't have permission to view it")

    return {
        "card_id": card.CardID,
        "card_name": card.CardName,
        "card_quality": card.CardQuality,
        "is_validated": card.IsValidated,
        "image_url": card.ImageURL
    }

@router.delete("/card-entry/{card_id}", dependencies=[Depends(req_user_or_admin)])
async def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Delete a specific card. Users can only delete their own cards.
    """
    cognito_user_id = auth_info.get("sub")

    # Retrieve the user_id from the profiles table based on the cognito_user_id
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    # Retrieve the card
    card = db.query(Card).filter(Card.CardID == card_id, Card.OwnerID == owner_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or you don't have permission to delete it")

    # Delete the associated image file if it exists
    if card.ImageURL and card.ImageURL.startswith("/static/uploads/"):
        image_path = os.path.join("static", "uploads", os.path.basename(card.ImageURL))
        try:
            if os.path.exists(image_path):
                os.remove(image_path)
        except Exception as e:
            print(f"Error deleting image file: {e}")

    # Delete the card from the database
    db.delete(card)
    db.commit()

    return {"message": "Card deleted successfully"}

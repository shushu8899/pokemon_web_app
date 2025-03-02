from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
import os
import shutil
from sqlalchemy.orm import Session
from app.models.card import Card
from app.db.db import get_db
from app.dependencies.auth import req_user_or_admin, get_current_user  # ✅ Allow both Users & Admins

router = APIRouter()

UPLOAD_DIR = "static/uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Ensure upload directory exists

@router.post("/card-entry", dependencies=[Depends(req_user_or_admin)])  # ✅ Allow both Users & Admins
async def create_or_update_card_entry(
    card_name: str = Form(...),
    card_quality: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)  # ✅ Require login
):
    """
    Users (Admins and regular users) can upload or update a Pokémon card with details.
    If the card already exists for the user, it will be **updated** instead of rejecting the request.
    """
    owner_id = auth_info.get("user_id")

    # ✅ Check if card already exists for this user
    existing_card = db.query(Card).filter(Card.CardName.ilike(card_name), Card.OwnerID == owner_id).first()

    # ✅ Save Image to Upload Directory
    file_path = os.path.join(UPLOAD_DIR, image.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    image_url = f"/static/uploads/{image.filename}"

    if existing_card:
        # ✅ Overwrite the existing card
        existing_card.CardQuality = card_quality
        existing_card.ImageURL = image_url
        db.commit()
        db.refresh(existing_card)
        return {
            "message": "Card updated successfully",
            "card_id": existing_card.CardID,
            "updated_image_url": image_url
        }
    else:
        # ✅ Create a new card entry
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

        return {
            "message": "Card entry successful",
            "card_id": new_card.CardID,
            "image_url": image_url
        }

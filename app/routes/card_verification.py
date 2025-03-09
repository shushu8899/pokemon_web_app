from fastapi import APIRouter, Depends, HTTPException
import os
from sqlalchemy.orm import Session
from app.services.card_verification import authenticate_card
from app.models.card import Card
from app.db.db import get_db
from app.dependencies.auth import req_user_or_admin
from app.services.profile_service import ProfileService, get_current_user

router = APIRouter()

@router.post("/verify-card/{card_id}")  # ✅ Use `card_id` instead of `card_name`
async def verify_card(
    card_id: int,  # ✅ Use unique ID instead of card name
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)  # ✅ Require authentication
):
    """
    Users and Admins can verify an existing Pokémon card.
    - Users can only verify **their own** cards.
    - Admins can verify **any** card.
    """
    # ✅ 1. Get User ID & Role from Cognito
    owner_id = auth_info.get("user_id")  # Get user ID from Cognito claims
    user_role = auth_info.get("role")  # Get user role (user/admin)

    # ✅ 2. Retrieve Card from DB Using `card_id`
    card = db.query(Card).filter(Card.CardID == card_id).first()  # ✅ Unique card selection

    if not card:
        raise HTTPException(status_code=404, detail=f"Card ID '{card_id}' not found.")

    # ✅ 3. Users can verify only **their own** cards (Admins can verify any card)
    if card.OwnerID != owner_id and user_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="You can only verify your own cards.")

    # ✅ 4. Convert ImageURL to Full File Path
    image_path = os.path.join(os.getcwd(), card.ImageURL.strip("/"))

    # ✅ 5. Run AI-based verification using stored image
    verification_result = authenticate_card(image_path)

    extracted_name = verification_result["result"]["pokemon_name"]
    is_authentic = verification_result["result"]["result"] == "Authentic"

    # ✅ 6. Ensure extracted name **matches** stored card name
    if extracted_name.lower() != card.CardName.lower() or not is_authentic:
        return {"message": "Card verification failed. Fake Pokémon card."}

    # ✅ 7. Mark the card as validated if authentic
    card.IsValidated = True
    db.commit()
    
    return {
        "message": "Card verified successfully. Authentic Pokémon card.",
        "card_id": card.CardID,
        "is_validated": True
    }

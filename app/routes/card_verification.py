from fastapi import APIRouter, Depends, HTTPException, Form
import os
from sqlalchemy.orm import Session
from app.services.card_verification import authenticate_card
from app.models.card import Card
from app.db.db import get_db
from app.dependencies.auth import req_user_or_admin
from app.services.profile_service import get_current_user
from app.models.profile import Profile


router = APIRouter()

@router.post("/verify-card/{card_id}", dependencies=[Depends(req_user_or_admin)])
async def verify_card(
    card_id: int,
    pokemon_tcg_id: str = Form(...),  # Accept Pokémon TCG ID from user
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Users and Admins can verify an existing Pokémon card.
    - Users can only verify **their own** cards.
    - Admins can verify **any** card.
    """
    # Get Cognito User ID from the sub claim
    cognito_user_id = auth_info.get("sub")
    user_role = auth_info.get("role", "user")

    # Get the user's profile to get actual UserID
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    # Retrieve Card from DB
    card = db.query(Card).filter(Card.CardID == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail=f"Card ID '{card_id}' not found.")

    # Check ownership
    if card.OwnerID != owner_id and user_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="You can only verify your own cards.")

    # get image_path
    image_path = card.ImageURL

    # Run AI-based verification
    verification_result = authenticate_card(image_path, pokemon_tcg_id)

    # Check if verification failed with an error
    if verification_result["result"]["result"] == "Error":
        return {
            "message": verification_result["result"].get("error", "Verification failed"),
            "card_id": card.CardID,
            "is_validated": False
        }

    is_authentic = verification_result["result"]["result"] == "Authentic"

    # Mark card as validated if authentic
    if is_authentic:
        card.IsValidated = True
        db.commit()

        return {
            "message": "Card verified successfully. Your Pokémon card is authentic.",
            "card_id": card.CardID,
            "is_validated": True,
            # "match_percentage": verification_result["result"].get("match_percentage", None),
            "pokemon_tcg_id": pokemon_tcg_id
        }
    else:
        return {
            "message": "Card verification failed. Your Pokémon card is fake.",
            "card_id": card.CardID,
            "is_validated": False,
            # "match_percentage": verification_result["result"].get("match_percentage", None),
            "pokemon_tcg_id": pokemon_tcg_id
        }

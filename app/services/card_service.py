#!/usr/bin/env python3

"""
Card DB Services, run database queries for specific manipulations
"""

from sqlalchemy.orm import Session
from app.models.card import Card, CardInfo
from app.models.profile import Profile
from app.models.auction import Auction


class CardService:
    def __init__(self, db: Session):
        self.db = db

    def get_cards_by_username(self, username: int):
        """
        Get all the cards that are owned by a username
        """
        # Check if the username exists
        profile = self.db.query(Profile).filter(Profile.Username == username).first()
        if not profile:
            return None
        user_id = profile.UserID

        return self.db.query(Card).filter(Card.OwnerID == user_id).all()

    def add_card(self, username: int, card_data: CardInfo):
        """
        Specific User adds new card
        """
        # Check if the user_id exist
        profile = self.db.query(Profile).filter(Profile.Username == username).first()
        if not profile:
            raise ServiceException(404, "User not found")
        user_id = profile.UserID

        card_data_dict = card_data.model_dump()
        card_data_dict["OwnerID"] = user_id

        new_card = Card(**card_data_dict)
        self.db.add(new_card)
        self.db.commit()
        self.db.refresh(new_card)
        return new_card

    def delete_card(self, card_id: int, username: str):
        """
        Delete card for specific User
        """
        # Check if the card exists
        profile = self.db.query(Profile).filter(Profile.Username == username).first()
        if not profile:
            return False
        card = self.db.query(Card).filter(Card.CardID == card_id, Card.OwnerID == profile.UserID).first()
        if not card:
            exists_card = self.db.query(Card).filter(Card.CardID == card_id).first()
            if not exists_card:
                raise ServiceException(404, "Card not found")
            raise ServiceException(403, "Forbidden to delete card")
        
        self.db.delete(card)
        self.db.commit()
        return True
    
    def get_validated_cards_by_user_id(self, user_id: int):
        """
        Get all validated cards owned by a user that are available for auction
        """
        cards = self.db.query(Card).filter(Card.OwnerID == user_id, Card.IsValidated == True).all()
        # Filter out cards that are in closed auctions with a highest bidder
        available_cards = []
        for card in cards:
            if self.db.query(Auction).filter(
                Auction.CardID == card.CardID,
                Auction.Status == "Closed",
                Auction.HighestBidderID.isnot(None)
            ).first() is None:
                available_cards.append(card)
        return available_cards
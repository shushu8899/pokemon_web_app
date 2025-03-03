#!/usr/bin/env python3

"""
Profile DB Services, run database queries for specific manipulations
"""

from sqlalchemy.orm import Session
from app.models.profile import Profile, ProfileInfo
from app.dependencies.auth import req_admin_role
from fastapi import Depends, HTTPException
from app.exceptions import ServiceException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.cognito_service import CognitoService
from app.models.auction import Auction
import logging

bearer_scheme = HTTPBearer()


class ProfileService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_profile(self):
        """
        Retrieve All Profiles
        """
        return self.db.query(Profile).all()

    def get_profile_username(self, username: str):
        """
        Retrieve Profile by Username
        """
        return self.db.query(Profile).filter(Profile.Username == username)
    
    def get_profile_id(self, cognito_id: str):
        """
        Retrieve Profile by Cognito ID
        """
        profile = self.db.query(Profile).filter(Profile.CognitoUserID == cognito_id).first()
        if profile:
            return profile.UserID
        return None

    def add_profile(self, profile_data: ProfileInfo):
        """
        Add a new profile
        """
        existing_profile = self.db.query(Profile).filter(Profile.Username == profile_data.Username).first()
        if existing_profile:
            raise ServiceException(409, "Username already exists")
        existing_profile = self.db.query(Profile).filter(Profile.Email == profile_data.Email).first()
        if existing_profile:    
            raise ServiceException(409, "Email already exists")
        new_profile = Profile(**profile_data.model_dump())
        self.db.add(new_profile)
        self.db.commit()
        self.db.refresh(new_profile)

        return new_profile

    def update_profile(self, username: str, updated_data: ProfileInfo):
        """
        Update profile information
        """
        
        profile = self.get_profile_username(username)
        if not profile:
            return None
        for key, value in updated_data.model_dump().items():
            setattr(profile, key, value)
        self.db.commit()
        self.db.refresh(profile)

        return profile
    
    def delete_profile(self, username: str):
        """
        Delete a profile by Username - Admin Only
        """

        username = self.db.query(Profile).filter(Profile.Username == username).first()
        if username:
            self.db.delete(username)
            self.db.commit()
            return True
        return False

    def rate_seller(self, user_id: int, auction_id: int, rating: int):
        """
        Rate a seller based on the auction ID and rating (1 to 5)
        """
        logging.info(f"Rating seller for user_id: {user_id}, auction_id: {auction_id}, rating: {rating}")
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

        # Retrieve the auction details
        auction = self.db.query(Auction).filter(Auction.AuctionID == auction_id).first()
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")

        # Ensure the auction status is "Closed"
        if auction.Status != "Closed":
            raise HTTPException(status_code=400, detail="Auction is not closed")

        # Ensure the user is the highest bidder
        if auction.HighestBidderID != user_id:
            raise HTTPException(status_code=403, detail="You are not the highest bidder for this auction")

        # Retrieve the seller's profile
        seller_profile = self.db.query(Profile).filter(Profile.UserID == auction.SellerID).first()
        if not seller_profile:
            raise HTTPException(status_code=404, detail="Seller not found")

        # Update the seller's profile with the new rating
        seller_profile.NumberOfRating += 1
        seller_profile.CurrentRating = ((seller_profile.CurrentRating * (seller_profile.NumberOfRating - 1)) + rating) / seller_profile.NumberOfRating

        self.db.commit()
        self.db.refresh(seller_profile)

        # Manually convert the Profile object to a dictionary
        seller_profile_dict = {
            "UserID": seller_profile.UserID,
            "Username": seller_profile.Username,
            "Email": seller_profile.Email,
            "NumberOfRating": seller_profile.NumberOfRating,
            "CurrentRating": seller_profile.CurrentRating,
        }

        return seller_profile_dict
    
def get_current_user(auth: HTTPAuthorizationCredentials = Depends(bearer_scheme), cognito_service: CognitoService = Depends(CognitoService)):
    token = auth.credentials
    payload = cognito_service.validate_token(auth)
    return payload

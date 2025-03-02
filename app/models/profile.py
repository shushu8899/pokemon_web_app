#!/usr/bin/env python3

"""
Profile Table - Will contain all the profile data
"""

from sqlalchemy import Column, Integer, VARCHAR, Float
from app.db.db import Base
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import relationship
from typing import Optional


class Profile(Base):
    __tablename__ = "profiles"

    UserID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Username = Column(VARCHAR, nullable=False, unique=True)
    Email = Column(VARCHAR, nullable=True)  # PDPA # Shouldn't email be primary key now that authentication uses email as username, only one account per email
    NumberOfRating = Column(Integer, nullable=False, default=0)
    CurrentRating = Column(Integer, nullable=False, default=0)
    CognitoUserID = Column(VARCHAR, nullable=True, unique=True)

    # Relationship with Cards and Notifications
    cards = relationship("Card", back_populates="profiles", cascade="all, delete-orphan")
    notifications = relationship('Notification', back_populates='user', cascade="all, delete-orphan")
    seller_id_auction = relationship("Auction", foreign_keys="[Auction.SellerID]", back_populates="seller")
    highest_bidder_auction = relationship("Auction", foreign_keys="[Auction.HighestBidderID]", back_populates="highest_bidder")


class ProfileBase(BaseModel):
    UserID: Optional[int] = None # Auto-incremented by the database
    Username: str
    Email: str
    NumberOfRating: Optional[int] = 0 
    CurrentRating: Optional[int] = 0.0
    CognitoUserID: str

    @field_validator("Email")
    @classmethod
    def check_email(cls, value : str):
        # Check if the email contains @
        if len(value.split("@")) != 2:
            raise ValueError("Invalid Email!")
        
        return value


class ProfileInfo(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

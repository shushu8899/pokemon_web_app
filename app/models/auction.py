#!/usr/bin/env python3

"""
Auction Table - Will contain all the auction data
"""

from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from app.db.db import Base
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from typing import Optional


class Auction(Base):
    __tablename__ = "auctions"

    AuctionID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    CardID = Column(Integer, ForeignKey("cards.CardID", ondelete="CASCADE"), nullable=False)
    SellerID = Column(Integer, ForeignKey("profiles.UserID", ondelete="CASCADE"), nullable=False)
    MinimumIncrement = Column(Float, nullable=False)
    Status = Column(String, nullable=False, default="In Progress")
    EndTime = Column(DateTime, nullable=False)
    HighestBidderID = Column(Integer, ForeignKey("profiles.UserID", ondelete="SET NULL"), nullable=True)
    HighestBid = Column(Float, nullable=False)
    
    # Relationship with Notifications, Cards and Sellers
    notifications = relationship('Notification', back_populates='auction', cascade="all, delete-orphan")
    card = relationship("Card", back_populates="card_id_auctions")
    seller = relationship("Profile", foreign_keys=[SellerID], back_populates="seller_id_auction")
    highest_bidder = relationship("Profile", foreign_keys=[HighestBidderID])

    def has_ended(self):
        """Check if the auction has ended."""
        return datetime.now(timezone.utc) > self.EndTime


class AuctionBase(BaseModel):
    AuctionID: Optional[int] = None  # Auto-incremented by the database
    CardID: int
    MinimumIncrement: float = Field(..., gt=0, description="The minimum increment should be greater than 0.")
    EndTime: datetime = Field(..., description="End time must be a valid datetime.")
    Status: str
    HighestBidderID: Optional[int]
    HighestBid: float

    @field_validator("EndTime")
    @classmethod
    def check_endtime(cls, value : datetime):
        # Make sure end time is later than now
        if value <= datetime.now():
            raise ValueError("End Time must be later than today!")
        
        return value

class AuctionInfo(AuctionBase):
    pass

class AuctionBid(BaseModel):
    AuctionID: int
    BidAmount: float

class AuctionResponse(BaseModel):
    """Response model for auction operations"""
    AuctionID: int
    CardID: int
    SellerID: int
    MinimumIncrement: float
    EndTime: datetime
    Status: str
    HighestBidderID: Optional[int] = None
    HighestBid: float
    
    model_config = ConfigDict(from_attributes=True)


#!/usr/bin/env python3

"""
Card Table - Will contain all the card data
"""

from sqlalchemy import Column, Integer, VARCHAR, String, Boolean, ForeignKey
from app.db.db import Base
from pydantic import BaseModel, field_validator, ConfigDict, Field
from sqlalchemy.orm import relationship
from typing import Optional


class Card(Base):
    __tablename__ = "cards"
    CardID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    OwnerID = Column(
        Integer, ForeignKey("profiles.UserID", ondelete="CASCADE"), nullable=False
    )

    CardQuality = Column(String, nullable=False, default="UNDEFINED")
    CardName = Column(VARCHAR, nullable=False)
    IsValidated = Column(Boolean, nullable=False, default=False)
    ImageURL = Column(String, nullable=True)  # Add ImageURL attribute

    profiles = relationship("Profile", back_populates="cards")
    card_id_auctions = relationship("Auction", back_populates="card")  # Reference the card ID


class CardBase(BaseModel):
    CardID: int
    CardName: str
    CardQuality: str
    OwnerID: int
    IsValidated: bool
    ImageURL: Optional[str]  # Add ImageURL to CardResponse


class CardInfo(CardBase):
    pass


class CardResponse(BaseModel):
    CardID: int
    CardName: str
    CardQuality: str
    OwnerID: int
    IsValidated: bool
    ImageURL: Optional[str]  # Add ImageURL to CardResponse

    class Config:
        from_attributes = True  # Use the new configuration key

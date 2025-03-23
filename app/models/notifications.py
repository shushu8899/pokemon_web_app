from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Boolean
from app.db.db import Base
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import relationship
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional


class Notification(Base):
    __tablename__ = 'notifications'
    
    NotificationID = Column(Integer, primary_key=True, autoincrement=True)
    ReceiverID = Column(Integer, ForeignKey('profiles.UserID'), nullable=False)
    AuctionID = Column(Integer, ForeignKey('auctions.AuctionID'), nullable=True)
    Message = Column(String, nullable=False)
    TimeSent = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Singapore")))
    IsRead = Column(Boolean, default=False) 

    # Relationships
    user = relationship('Profile', back_populates='notifications')
    auction = relationship('Auction', back_populates='notifications')

    def __repr__(self):
        return (
            f"<Notification(id={self.NotificationID}, "
            f"user_id={self.ReceiverID}, "
            f"auction_id={self.AuctionID}, "
            f"message='{self.Message[:30] if self.Message else ''}', "
            f"time_sent='{self.TimeSent}', "
            f"is_read={self.IsRead})>"
        )


# Base model
class NotificationBase(BaseModel):
    Message: str


# Creation input model
class NotificationInfo(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    NotificationID: int
    ReceiverID: int
    AuctionID: Optional[int]
    TimeSent: datetime
    IsRead: bool  

    model_config = ConfigDict(from_attributes=True)

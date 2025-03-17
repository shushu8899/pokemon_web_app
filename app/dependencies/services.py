from fastapi import Depends
from app.services.auction_service import AuctionService
from app.services.profile_service import ProfileService
from app.services.search_service import SearchService
from app.services.card_service import CardService
from app.services.websocket_manager import WebSocketManager
from app.dependencies.db import get_db
from sqlalchemy.orm import Session

def get_auction_service(db: Session = Depends(get_db)) -> AuctionService:
    return AuctionService(db)

def get_profile_service(db: Session = Depends(get_db)) -> ProfileService:
    return ProfileService(db)

def get_search_service(db: Session = Depends(get_db)) -> SearchService:
    return SearchService(db)

def get_card_service(db: Session = Depends(get_db)) -> CardService:
    return CardService(db)

def get_websocket_manager(db: Session = Depends(get_db)) -> WebSocketManager:
    return WebSocketManager(db=db)
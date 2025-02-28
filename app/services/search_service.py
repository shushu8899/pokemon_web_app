from sqlalchemy.orm import Session
from app.models.card import Card, CardInfo
from app.models.profile import Profile
from app.models.auction import Auction, AuctionInfo
from app.services.profile_service import ProfileService

class SearchService:
    def __init__(self, db: Session):
        self.db = db

    def search_cards(self, search_query: str):
        """
        Search for cards based on the search query
        """
        search_pattern = f"%{search_query}%"
        return self.db.query(Card).filter(Card.CardName.like(search_pattern)).all()

    def search_profiles(self, search_query: str):
        """
        Search for profiles based on the search query
        """
        search_pattern = f"%{search_query}%"
        return self.db.query(Profile).filter(Profile.Username.like(search_pattern)).all()
    
    def search_auctions(self, search_query: str):
        """
        Search for auctions based on the search query
        """
        search_pattern = f"%{search_query}%"
        return self.db.query(Auction).filter(Auction.AuctionID.like(search_pattern)).all()
    
    def get_card_counts(self, search_query: str):
        """
        Get all cards
        """
        search_pattern = f"%{search_query}%"
        total_cards = self.db.query(Card).filter(Card.CardName.like(search_pattern)).count()
        return total_cards
    
    def get_profile_counts(self, search_query: str):
        """
        Get all profiles
        """
        search_pattern = f"%{search_query}%"
        total_profiles = self.db.query(Profile).filter(Profile.Username.like(search_pattern)).count()
        return total_profiles
    
    def get_auction_counts(self, search_query: str):
        """
        Get all auctions
        """
        search_pattern = f"%{search_query}%"
        total_auctions = self.db.query(Auction).filter(Auction.AuctionID.like(search_pattern)).count()
        return total_auctions


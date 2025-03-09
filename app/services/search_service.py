from sqlalchemy.orm import Session
from app.models.card import Card, CardInfo
from app.models.profile import Profile
from app.models.auction import Auction, AuctionInfo
from app.services.profile_service import ProfileService
from sqlalchemy import String, Text
from sqlalchemy import or_

class SearchService:
    def __init__(self, db: Session):
        self.db = db
        # Define searchable and returnable columns for each model
        self.searchable_models = {
            Profile: {
                "searchable_columns": ["Username"],
                "return_columns": ["Username", "Email", "NumberOfRating", "CurrentRating"]
            },
            Card: {
                "searchable_columns": ["OwnerID","CardName", "CardQuality"],
                "return_columns": ["OwnerID","CardName", "CardQuality"]
            },
            Auction: {
                "searchable_columns": ["AuctionID", "SellerID"],
                "return_columns": ["AuctionID", "SellerID", "Status"]
            }
        }

    def search_all_tables(self, query):
        if not query.strip():
            return {}  # Prevent searching everything
        
        search_term = f"%{query}%"
        results = {}

        for model, columns in self.searchable_models.items():
            filters = [getattr(model, col).like(search_term) for col in columns["searchable_columns"] if hasattr(model, col)]

            query_results = self.db.query(model).filter(or_(*filters)).all()
            
            model_results = [{col: getattr(item, col, None) for col in columns["return_columns"]} for item in query_results]
            results[model.__name__] = model_results

        return results

    # def search_cards(self, search_query: str):
    #     """
    #     Search for cards based on the search query
    #     """
    #     search_pattern = f"%{search_query}%"
    #     return self.db.query(Card).filter(Card.CardName.like(search_pattern)).all()

    # def search_profiles(self, search_query: str):
    #     """
    #     Search for profiles based on the search query
    #     """
    #     search_pattern = f"%{search_query}%"
    #     return self.db.query(Profile).filter(Profile.Username.like(search_pattern)).all()
    
    # def search_auctions(self, search_query: str):
    #     """
    #     Search for auctions based on the search query
    #     """
    #     search_pattern = f"%{search_query}%"
    #     return self.db.query(Auction).filter(Auction.AuctionID.like(search_pattern)).all()
    
    # def get_card_counts(self, search_query: str):
    #     """
    #     Get all cards
    #     """
    #     search_pattern = f"%{search_query}%"
    #     total_cards = self.db.query(Card).filter(Card.CardName.like(search_pattern)).count()
    #     return total_cards
    
    # def get_profile_counts(self, search_query: str):
    #     """
    #     Get all profiles
    #     """
    #     search_pattern = f"%{search_query}%"
    #     total_profiles = self.db.query(Profile).filter(Profile.Username.like(search_pattern)).count()
    #     return total_profiles
    
    # def get_auction_counts(self, search_query: str):
    #     """
    #     Get all auctions
    #     """
    #     search_pattern = f"%{search_query}%"
    #     total_auctions = self.db.query(Auction).filter(Auction.AuctionID.like(search_pattern)).count()
    #     return total_auctions


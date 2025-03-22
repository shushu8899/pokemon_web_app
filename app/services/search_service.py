from sqlalchemy.orm import Session
from app.models.card import Card
from app.models.profile import Profile
from app.models.auction import Auction
from sqlalchemy import or_

class SearchService:
    def __init__(self, db: Session):
        self.db = db
        self.searchable_models = {
            Profile: {
                "searchable_columns": ["Username"],
                "return_columns": ["Username", "Email", "NumberOfRating", "CurrentRating"]
            },
            Card: {
                "searchable_columns": ["CardName", "CardQuality"],
                "return_columns": ["OwnerID","CardName", "CardQuality"]
            },
            Auction: {
                "searchable_columns": ["AuctionID", "SellerID"],
                "return_columns": ["AuctionID", "SellerID", "Status"]
            }
        }

    def search_all_tables(self, query):
        search_term = f"%{query}%"
        results = []

        for model, columns in self.searchable_models.items():
            filters = [getattr(model, column_name).like(search_term) for column_name in columns["searchable_columns"]]
            if filters:
                query_results = self.db.query(model).filter(or_(*filters)).all()
                for item in query_results:
                    item_dict = {col: getattr(item, col) for col in columns["return_columns"] if hasattr(item, col)}
                    item_dict['_table'] = model.__name__
                    results.append(item_dict)


        print(f"Debug: Total results = {len(results)}")  # Debug statement
        return results

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
    
    def search_auctions(self, user_id: int):
        """
        Search for auctions based on the user ID
        """
        return self.db.query(Auction).filter(Auction.SellerID == user_id).all()
    
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


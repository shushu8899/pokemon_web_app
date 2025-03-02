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
        # To only allow certain columns to be searchable and returned
        self.searchable_models = {
            Profile: ["Username"],
            Card: ["CardName", "CardQuality"],
            Auction: ["AuctionID"]
        }
    def search_all_tables(self, query):
        search_term = f"%{query}%"
        results = []

        for model, columns in self.searchable_models.items():
            # Create filter conditions for each searchable column
            filters = [getattr(model, column_name).like(search_term) for column_name in columns]

            # Execute query with OR conditions
            if filters:
                query_results = self.db.query(model).filter(or_(*filters)).all()

                # Convert results to dictionaries
                for item in query_results:
                    item_dict = {col: getattr(item, col) for col in columns if hasattr(item, col)}
                    item_dict['_table'] = model.__name__  # Add table name for reference
                    results.append(item_dict)

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


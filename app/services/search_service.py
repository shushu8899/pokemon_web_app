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
                "return_columns": ["OwnerID","CardName", "CardQuality","ImageURL"]
            },
            Auction: {
                "searchable_columns": ["AuctionID", "SellerID"],
                "return_columns": ["AuctionID", "SellerID", "Status","EndTime", "HighestBid"]
            }
        }

    def search_all_tables(self, query):
        search_term = f"%{query}%"
        results = {
            'profiles': [],
            'card_auctions': []
        }
        
        # 1. Search profiles (no joins needed)
        profile_filters = [getattr(Profile, col).like(search_term) 
                        for col in self.searchable_models[Profile]["searchable_columns"]]
        if profile_filters:
            profile_results = self.db.query(Profile).filter(or_(*profile_filters)).all()
            for item in profile_results:
                item_dict = {col: getattr(item, col) for col in self.searchable_models[Profile]["return_columns"]}
                item_dict['result_type'] = 'Profile'
                results['profiles'].append(item_dict)
        
        # 2. Find cards with matching auctions using INNER JOIN
        card_auction_query = (
            self.db.query(Card, Auction)
            .join(Auction, Card.CardID == Auction.CardID)  # INNER JOIN ensures cards must have auctions
            .filter(
                or_(
                    *[getattr(Card, col).like(search_term) for col in self.searchable_models[Card]["searchable_columns"]],
                    *[getattr(Auction, col).like(search_term) for col in self.searchable_models[Auction]["searchable_columns"]]
                )
            )
        )
        
        # Execute the query
        card_auction_results = card_auction_query.all()
        
        # Process the results
        for card, auction in card_auction_results:
            card_dict = {col: getattr(card, col) for col in self.searchable_models[Card]["return_columns"]}
            auction_dict = {col: getattr(auction, col) for col in self.searchable_models[Auction]["return_columns"]}
            
            results['card_auctions'].append({
                'result_type': 'CardAuction',
                'card': card_dict,
                'auction': auction_dict
            })
        
        # 3. Apply overall pagination and return
        all_results = []
        all_results.extend(results['profiles'])
        all_results.extend(results['card_auctions'])
        
        return {
            "total": len(all_results),
            "results": all_results,
            "categories": {
                "profiles": len(results['profiles']),
                "card_auctions": len(results['card_auctions'])
            }
        }

    def search_auctions(self, user_id: int):
        """
        Search for auctions based on the user ID
        """
        auctions = self.db.query(Auction).filter(Auction.SellerID == user_id).all()
        result = []
        
        for auction in auctions:
            # Get the card associated with this auction
            card = self.db.query(Card).filter(Card.CardID == auction.CardID).first()
            
            if card:
                auction_details = {
                    "AuctionID": auction.AuctionID,
                    "CardID": auction.CardID,
                    "SellerID": auction.SellerID,
                    "EndTime": auction.EndTime,
                    "Status": auction.Status,
                    "HighestBid": auction.HighestBid,
                    "CardName": card.CardName,
                    "CardQuality": card.CardQuality,
                    "ImageURL": card.ImageURL  # Use the ImageURL from the card
                }
                result.append(auction_details)
        
        return result
    
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


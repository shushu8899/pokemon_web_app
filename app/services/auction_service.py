#!/usr/bin/env python3

"""
Auction Services, run database queries for specific manipulations
"""

from sqlalchemy.orm import Session
from app.models.card import Card, CardInfo
from app.models.profile import Profile
from app.models.auction import Auction, AuctionInfo, AuctionBid
from app.models.notifications import Notification
from app.services.profile_service import ProfileService
from datetime import datetime, timedelta
from fastapi import HTTPException, BackgroundTasks, UploadFile
import os
import shutil
import uuid
import logging
from typing import Union


class AuctionService:
    def __init__(self, db: Session):
        self.db = db

    def get_auctions_by_page(self, page:int,page_size: int = 10):
        """
        Get auctions by page limited to 10 auctions per page
        Display the expiring auctions first
        """
        current_date = datetime.today().date() # assume endtime is a date
        offset = (page - 1) * page_size  # Pagination offset
        query_result = (
            self.db.query(            
                Auction.AuctionID,
                Auction.CardID,
                Auction.Status,
                Auction.HighestBid,
                Card.IsValidated,
                Card.CardName,
                Card.CardQuality,
                Auction.ImageURL  # Ensure this is the correct field in `Card)
            )
            .join(Card, Auction.CardID == Card.CardID)  # Join auctions with card details
            .filter(Auction.EndTime >= current_date)  # Only include auctions that are not expired
            .order_by(Auction.EndTime)  # Sort by earliest expiration
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return [dict(zip(["AuctionID", "CardID", "Status", "HighestBid", "IsValidated", "CardName", "CardQuality", "ImageURL"], row)) for row in query_result]

    def get_auctions_details(self, auction_id: int):
        """
        Get auctions by auction id for bidding
        """
        query_result = ( 
            self.db.query(            
            Auction.AuctionID,
            Auction.CardID,
            Auction.Status,
            Auction.HighestBid,
            Card.IsValidated,
            Card.CardName,
            Card.CardQuality,
            Auction.ImageURL  # Ensure this is the correct field in `Card)
            )
            .join(Card, Auction.CardID == Card.CardID)  # Join auctions with card details
            .filter(Auction.AuctionID == auction_id) 
            .first()
        )
        print(query_result)
        auction_indiv = dict(zip(["AuctionID", "CardID", "Status", "HighestBid", "IsValidated", "CardName", "CardQuality", "ImageURL"], query_result))
        if not auction_indiv:
            raise HTTPException(status_code=404, detail="Auction not found")
        return auction_indiv

    def get_total_page(self):
        """
        Get total page of auctions
        """
        current_date = datetime.today().date() # assume endtime is a date
        available_auction = self.db.query(Auction).filter(Auction.EndTime>=current_date).all()
        return len(available_auction) // 10 + 1
    
    def get_auction_by_id(self, auction_id: int):
        """
        Get specific auction by auction ID
        """
        return self.db.query(Auction).filter(Auction.AuctionID == auction_id).first()

    def create_auction(self, file: UploadFile, card_name: str, card_quality: str, is_validated: bool, starting_bid: float, minimum_increment: float, auction_duration: float, user_id: int):
        '''Generate a unique filename using UUID to ensure no conflict in filenames'''
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join("static/uploads", unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logging.debug(f"File saved successfully to: {file_path}")
        except Exception as e:
            logging.error(f"Failed to save file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        '''Create card record'''
        card = Card(CardName=card_name,
                    CardQuality=card_quality,
                    OwnerID=user_id,  # Use the user_id obtained from the profiles table
                    IsValidated=is_validated)
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)

        '''Calculate the end time of the auction'''
        end_time = datetime.now() + timedelta(hours=auction_duration)

        # Validate the end time
        if end_time <= datetime.now():
            raise HTTPException(status_code=400, detail="End Time must be later than the current time!")

        # Validate the starting bid
        if starting_bid <= 0:
            raise HTTPException(status_code=400, detail="Starting bid must be greater than zero!")

        # Validate the minimum increment
        if minimum_increment <= 0:
            raise HTTPException(status_code=400, detail="Minimum increment must be greater than zero!")

        '''Create auction record'''
        auction_data = Auction(
            CardID=card.CardID,
            CardName=card_name,
            SellerID=card.OwnerID,
            MinimumIncrement=minimum_increment,
            EndTime=end_time,
            Status="In Progress" if end_time > datetime.now() else "Ended",
            HighestBidderID=None,  # Set to None initially
            HighestBid=starting_bid,
            ImageURL=f"{file_path}"
        )

        self.db.add(auction_data)
        self.db.commit()
        self.db.refresh(auction_data)

        return auction_data
    
    def delete_auction(self, auction_id: int, user_id: int):
        """
        Delete an auction by its ID if the user is the seller
        """
        # Check if auction exists
        auction = self.get_auction_by_id(auction_id)
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")

        # Check if the user is the seller
        if auction.SellerID != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this auction")

        # Delete the auction
        self.db.delete(auction)
        self.db.commit()
        return {"message": "Auction deleted successfully"}

    def get_auctions_by_seller(self, seller_id: int):
        """
        Retrieve auctions by seller ID
        """
        return self.db.query(Auction).filter(Auction.SellerID == seller_id).all()   
    
    def update_auction(self, auction_id: int, cognito_user_id: str, file: UploadFile, card_name: str, card_quality: str, is_validated: bool, starting_bid: float, minimum_increment: float, auction_duration: float, profile_service: ProfileService):
        """
        Update the auction data
        """
        # Get the user ID from the Cognito user ID
        user_id = profile_service.get_profile_id(cognito_user_id)
        if not user_id:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if auction exists
        auction = self.get_auction_by_id(auction_id)
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")

        # Check if the user is the seller
        if auction.SellerID != user_id:
            raise HTTPException(status_code=403, detail="You do not have permission to update this auction")

        # Check if the HighestBidderID is not None
        if auction.HighestBidderID is not None:
            raise HTTPException(status_code=403, detail="You cannot update auction because it is already in progress")

        # Generate a unique filename using UUID to ensure no conflict in filenames
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join("static/uploads", unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logging.debug(f"File saved successfully to: {file_path}")
        except Exception as e:
            logging.error(f"Failed to save file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        # Update the card record
        card = self.db.query(Card).filter(Card.CardID == auction.CardID).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        card.CardName = card_name
        card.CardQuality = card_quality
        card.IsValidated = is_validated
        self.db.commit()
        self.db.refresh(card)

        # Calculate the end time of the auction
        end_time = datetime.now() + timedelta(hours=auction_duration)

        # Validate the end time
        if end_time <= datetime.now():
            raise HTTPException(status_code=400, detail="End Time must be later than the current time!")

        # Validate the starting bid
        if starting_bid <= 0:
            raise HTTPException(status_code=400, detail="Starting bid must be greater than zero!")

        # Validate the minimum increment
        if minimum_increment <= 0:
            raise HTTPException(status_code=400, detail="Minimum increment must be greater than zero!")

        # Update the auction record
        auction.CardName = card_name
        auction.MinimumIncrement = minimum_increment
        auction.EndTime = end_time
        auction.StartingBid = starting_bid
        auction.ImageURL = file_path
        self.db.commit()
        self.db.refresh(auction)

        return auction

    def bid_auction(self, cognito_user_id: str, bid_info: AuctionBid, profile_service: ProfileService):
        """
        Make a new bid in an auction
        """
        # Get the user ID from the Cognito user ID
        user_id = profile_service.get_profile_id(cognito_user_id)
        if not user_id:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if auction exists
        auction = self.get_auction_by_id(bid_info.AuctionID)
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")

        # Refresh the status of the auction based on the current time
        current_time = datetime.now()
        if current_time > auction.EndTime:
            auction.Status = "Closed"
        else:
            auction.Status = "In Progress"
        self.db.commit()
        self.db.refresh(auction)

        # Check if the auction is closed
        if auction.Status == "Closed":
            raise HTTPException(status_code=400, detail="Cannot bid on a closed auction")

        # Check if user_id is the seller
        if auction.SellerID == user_id:
            raise HTTPException(status_code=403, detail="Seller cannot bid on their own auction")

        # Check if the bid amount is greater than the highest bid plus the minimum increment
        if bid_info.BidAmount <= auction.HighestBid + auction.MinimumIncrement:
            raise HTTPException(status_code=400, detail="Bid amount must be greater than the highest bid plus the minimum increment")

        # Save the previous highest bidder ID before updating the auction
        previous_highest_bidder = auction.HighestBidderID
        previous_highest_bid = auction.HighestBid

        # Update the auction with the new highest bid and highest bidder ID
        auction.HighestBid = bid_info.BidAmount
        auction.HighestBidderID = user_id
        self.db.commit()
        self.db.refresh(auction)

        # If the previous highest bidder exists, create a notification
        if previous_highest_bidder:
            message = f"You have been outbid! New highest bid: ${bid_info.BidAmount}"
            notification = Notification(
                BidderID=previous_highest_bidder,
                AuctionID=auction.AuctionID,
                Message=message,
                TimeSent=datetime.now()
            )
            self.db.add(notification)
            self.db.commit()

        return auction

    def get_auction_by_card_name_qualty(
        self, card_name: str, card_quality: str = "None"
    ):
        """
        Retrieve auctions by specific card name
        """
        if card_quality == "None":
            cards = self.db.query(Card).filter(Card.CardName == card_name).all()
        else:
            cards = (
                self.db.query(Card)
                .filter(Card.CardName == card_name, Card.CardQuality == card_quality)
                .all()
            )

        # We then search the auctions by their specific card_ids to match
        auction_list = []
        for select_card in cards:
            auction_list.extend(
                self.db.query(Auction).filter(
                    Auction.CardID == select_card.CardID,
                    Auction.SellerID == select_card.OwnerID,
                )
            )

        return auction_list

    def end_expired_auctions(self):
        """Automatically ends auctions that have expired."""
        now = datetime.now()  # Use timezone-aware datetime
        expired_auctions = self.db.query(Auction).filter(
            Auction.Status == "In Progress",
            Auction.EndTime <= now
        ).all()

        for auction in expired_auctions:
            auction.Status = "Ended"
            self.db.commit()

            # Notify the highest bidder
            if auction.HighestBidderID:
                message = f"Congratulations! You have won the auction for {auction.CardID} with a bid of ${auction.HighestBid}."
                notification = Notification(
                    BidderID=auction.HighestBidderID,
                    AuctionID=auction.AuctionID,
                    Message=message,
                    TimeSent=datetime.now()
                )
                self.db.add(notification)

            # Notify the seller
            message = f"Your auction for {auction.CardID} has ended. Final bid: ${auction.HighestBid}."
            notification = Notification(
                BidderID=auction.SellerID,  # Notify the seller as well
                AuctionID=auction.AuctionID,
                Message=message,
                TimeSent=datetime.now()
            )
            self.db.add(notification)

            self.db.commit()

        print(f"{len(expired_auctions)} auctions ended.")

    def schedule_auction_cleanup(background_tasks: BackgroundTasks, db: Session):
        auction_service = AuctionService(db)
        background_tasks.add_task(auction_service.end_expired_auctions)

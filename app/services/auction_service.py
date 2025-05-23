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
from zoneinfo import ZoneInfo
from fastapi import HTTPException, BackgroundTasks, UploadFile
from typing import Union
from app.exceptions import ServiceException
from app.services.websocket_manager import websocket_manager


class AuctionService:
    def __init__(self, db: Session):
        self.db = db
        self.websocket_manager = websocket_manager

    def get_auctions_by_page(self, page: int, page_size: int = 10):
        """
        Get auctions by page limited to 10 auctions per page
        Display the expiring auctions first
        """
        current_date = datetime.today().date()  # assume endtime is a date
        offset = (page - 1) * page_size  # Pagination offset
        query_result = (
            self.db.query(
                Auction.AuctionID,
                Auction.CardID,
                Auction.Status,
                Auction.EndTime,
                Auction.HighestBid,
                Card.IsValidated,
                Card.CardName,
                Card.CardQuality,
                Card.ImageURL,  # Include ImageURL from Card
            )
            .join(Card, Auction.CardID == Card.CardID)  # Join auctions with card details
            .filter(Auction.EndTime >= current_date)  #Only include auctions that are not expired 
            .order_by(Auction.EndTime)  # Sort by earliest expiration
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return [dict(zip(["AuctionID", "CardID", "Status", "EndTime", "HighestBid", "IsValidated", "CardName", "CardQuality", "ImageURL"], row)) for row in query_result]


    async def update_auction_status(self):
        current_time = datetime.now(ZoneInfo("Asia/Singapore")).replace(tzinfo=None)
        auctions = self.db.query(Auction).all()
        # print("Updating auction status...")
        for auction in auctions:
            # print(f"Auction ID: {auction.AuctionID} - Auction Status: {auction.Status} - End Time: {auction.EndTime} - Current Time: {current_time} - Highest Bidder: {auction.HighestBidderID}") 
            card = self.db.query(Card).filter(Card.CardID == auction.CardID).first()
            card_name = card.CardName if card else f"Card ID {auction.CardID}"
            if auction.EndTime > current_time:
                auction.Status = "In Progress"
                self.db.commit()
                self.db.refresh(auction)
            elif auction.EndTime <= current_time and auction.Status == "In Progress":
                # Get card info for message
                if auction.HighestBidderID:
                    auction.Status = "Closed"
                    self.db.commit()
                    self.db.refresh(auction)
                    # print(f"Auction ID: {auction.AuctionID} - Auction Status: {auction.Status}") 
                    # Notify the highest bidder
                    message_b = f"Congratulations! You have won the auction for '{card_name}' with a bid of ${auction.HighestBid:.2f}."
                    notification = Notification(
                        ReceiverID=auction.HighestBidderID,
                        AuctionID=auction.AuctionID,
                        Message=message_b,
                    )
                    self.db.add(notification)
                    self.db.commit()
                    self.db.refresh(notification)

                    highest_bidder_profile = self.db.query(Profile).filter(Profile.UserID == auction.HighestBidderID).first()
                    await self.websocket_manager.send_notification(
                        highest_bidder_profile.Email,
                        {
                            "notification_id": notification.NotificationID,
                            "auction_id": auction.AuctionID,
                            "message": message_b,
                            "sent_date": notification.TimeSent.isoformat(),
                            "is_read": False
                        }
                    )

                    # Notify the seller
                    message_s = f"Your auction for '{card_name}' has ended. Final bid: ${auction.HighestBid:.2f}."
                    notification = Notification(
                        ReceiverID=auction.SellerID,
                        AuctionID=auction.AuctionID,
                        Message=message_s,
                    )
                    self.db.add(notification)
                    self.db.commit()
                    self.db.refresh(notification)

                    seller_profile = self.db.query(Profile).filter(Profile.UserID == auction.SellerID).first()
                    await self.websocket_manager.send_notification(
                        seller_profile.Email,
                        {
                            "notification_id": notification.NotificationID,
                            "auction_id": auction.AuctionID,
                            "message": message_s,
                            "sent_date": notification.TimeSent.isoformat(),
                            "is_read": False
                        }
                    )
                    # print("1 Notification created successfully")

                else:
                    auction.Status = "Expired"
                    self.db.commit()
                    self.db.refresh(auction)
                    # print(f"Auction ID: {auction.AuctionID} - Auction Status: {auction.Status}") 
                    # Notify the seller that no one bid
                    message_s = f"Your auction for '{card_name}' has ended with no bids. Consider adjusting the starting bid or relisting it later."
                    notification = Notification(
                        ReceiverID=auction.SellerID,
                        AuctionID=auction.AuctionID,
                        Message=message_s,
                    )
                    self.db.add(notification)
                    self.db.commit()
                    self.db.refresh(notification)

                    seller_profile = self.db.query(Profile).filter(Profile.UserID == auction.SellerID).first()
                    await self.websocket_manager.send_notification(
                        seller_profile.Email,
                        {
                            "notification_id": notification.NotificationID,
                            "auction_id": auction.AuctionID,
                            "message": message_s,
                            "sent_date": notification.TimeSent.isoformat(),
                            "is_read": False
                        }
                    )
                    # print("2 Notification created successfully")



    def get_auctions_details(self, auction_id: int):
        """
        Get auction details by auction ID
        """
        auction = ( 
            self.db.query(Auction)
            .filter(Auction.AuctionID == auction_id) 
            .first()
        )
        if not auction:
            raise HTTPException(status_code=404, detail="Auction not found")

        # Update the status of the auction based on the current datetime
        current_time = datetime.now(ZoneInfo("Asia/Singapore"))
        if auction.EndTime > current_time:
            auction.Status = "In Progress"
        elif auction.EndTime <= current_time and auction.HighestBid > 0:
            auction.Status = "Closed"
        else:
            auction.Status = "Expired"

        self.db.commit()
        self.db.refresh(auction)

        card = self.db.query(Card).filter(Card.CardID == auction.CardID).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        auction_details = {
            "AuctionID": auction.AuctionID,
            "CardID": auction.CardID,
            "SellerID": auction.SellerID,
            "MinimumIncrement": auction.MinimumIncrement,
            "EndTime": auction.EndTime,
            "Status": auction.Status,
            "HighestBidderID": auction.HighestBidderID,
            "HighestBid": auction.HighestBid,
            "CardName": card.CardName,
            "CardQuality": card.CardQuality,
            "IsValidated": card.IsValidated,
            "ImageURL": card.ImageURL  # Use the ImageURL from the card
        }

        return auction_details

    def get_total_page(self):
            """
            Get total page of auctions
            """
            current_date = datetime.utcnow().isoformat()  # ✅ Returns "YYYY-MM-DDTHH:MM:SS.ssssss"
            print(current_date)
            available_auction = self.db.query(Auction).all()
            # available_auction = self.db.query(Auction).filter(Auction.EndTime>=current_date).all()  # to add back
            return len(available_auction) // 10 + 1
    

    def get_auction_by_id(self, auction_id: int):
        """
        Get specific auction by auction ID
        """
        auction = self.db.query(Auction).filter(Auction.AuctionID == auction_id).first()
        # if auction:
        #     self._update_auction_status(auction)
        return auction

    def create_auction(self, user_id: int, card_id: int, starting_bid: float, minimum_increment: float, auction_duration: float):
        """
        Create a new auction
        """
        # Check if the card exists and belongs to the user
        card = self.db.query(Card).filter(Card.CardID == card_id, Card.OwnerID == user_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found or you do not have permission to use this card")

        # Check if the card is validated
        if not card.IsValidated:
            raise HTTPException(status_code=400, detail="Card is not validated and cannot be used for auction")

        # Check if the card is already in an auction with status "In Progress"
        existing_auction = self.db.query(Auction).filter(Auction.CardID == card_id, Auction.Status == "In Progress").first()
        if existing_auction:
            raise HTTPException(status_code=400, detail="Card is already in an auction that is in progress")

        # Calculate the end time of the auction
        end_time = datetime.now(ZoneInfo("Asia/Singapore")) + timedelta(hours=auction_duration)

        # Validate the end time
        if end_time <= datetime.now(ZoneInfo("Asia/Singapore")):
            raise HTTPException(status_code=400, detail="End Time must be later than the current time!")

        # Validate the starting bid
        if starting_bid <= 0:
            raise HTTPException(status_code=400, detail="Starting bid must be greater than zero!")

        # Validate the minimum increment
        if minimum_increment <= 0:
            raise HTTPException(status_code=400, detail="Minimum increment must be greater than zero!")

        # Create auction record
        auction_data = Auction(
            CardID=card.CardID,
            SellerID=card.OwnerID,
            MinimumIncrement=minimum_increment,
            EndTime=end_time,
            Status="In Progress" if end_time > datetime.now(ZoneInfo("Asia/Singapore")) else "Ended",
            HighestBidderID=None,  # Set to None initially
            HighestBid=starting_bid
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
        auctions = self.db.query(Auction).filter(Auction.SellerID == seller_id).all()
        # Update status for each auction
        # for auction in auctions:
        #     self._update_auction_status(auction)
        return auctions
    
    def update_auction(self, auction_id: int, cognito_user_id: str, minimum_increment: float, starting_bid: float, auction_duration: float, profile_service: ProfileService):
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

        # Check if the auction is closed
        if auction.Status == "Closed":
            raise HTTPException(status_code=403, detail="Cannot update a closed auction")

        # Check if the HighestBidderID is not None
        if auction.HighestBidderID is not None:
            raise HTTPException(status_code=403, detail="You cannot update auction because it is already in progress")

        # Calculate the end time of the auction
        end_time = datetime.now(ZoneInfo("Asia/Singapore")) + timedelta(hours=auction_duration)

        # Validate the end time
        if end_time <= datetime.now(ZoneInfo("Asia/Singapore")):
            raise HTTPException(status_code=400, detail="End Time must be later than the current time!")

        # Validate the starting bid
        if starting_bid <= 0:
            raise HTTPException(status_code=400, detail="Starting bid must be greater than zero!")

        # Validate the minimum increment
        if minimum_increment <= 0:
            raise HTTPException(status_code=400, detail="Minimum increment must be greater than zero!")

        # Update the auction record
        auction.MinimumIncrement = minimum_increment
        auction.EndTime = end_time
        auction.HighestBid = starting_bid  # Update HighestBid to match starting_bid

        # Compare current datetime vs end time of the auction
        current_time = datetime.now(ZoneInfo("Asia/Singapore"))
        if current_time > auction.EndTime:
            auction.Status = "Closed"
        else:
            auction.Status = "In Progress"

        self.db.commit()
        self.db.refresh(auction)

        return auction

    async def bid_auction(self, cognito_user_id: str, bid_info: AuctionBid, profile_service: ProfileService):
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
        #Check if user id is the seller
        if auction.SellerID == user_id:
            raise HTTPException(status_code=403, detail="Seller cannot bid on their own auction")
        
        if auction.Status == "Closed":
            raise HTTPException(status_code=400, detail="Cannot bid on a closed auction")

        if auction.HighestBid + auction.MinimumIncrement > bid_info.BidAmount:
            print(f"user bid {bid_info.BidAmount} not high enough, cur bid : {auction.HighestBid + auction.MinimumIncrement}")
            return None  # Current bid not high enough
        else:
            #Save the previous highest bidder ID before updating the auction
            previous_highest_bidder = auction.HighestBidderID
            previous_bidder_profile = self.db.query(Profile).filter(Profile.UserID == previous_highest_bidder).first()
            
            # Only proceed with notification if we have a valid previous bidder profile
            if previous_highest_bidder and previous_bidder_profile:
                previous_bidder_email = previous_bidder_profile.Email
                previous_highest_bid = auction.HighestBid
                
                for key, value in bid_info.model_dump().items():
                    setattr(auction, key, value)
                # Update bid fields explicitly
                auction.HighestBid = bid_info.BidAmount
                auction.HighestBidderID = user_id
                self.db.commit()
                self.db.refresh(auction)
                
                if previous_highest_bidder != user_id:
                    # Notify the previous highest bidder
                    message = f"You have been outbid! New highest bid: ${bid_info.BidAmount:.2f}"
                    notification = Notification(
                        ReceiverID=previous_highest_bidder,
                        AuctionID=auction.AuctionID,
                        Message=message,
                        IsRead=False  # mark as unread
                    )
                    self.db.add(notification)
                    self.db.commit()
                    self.db.refresh(notification)

                    # Structured real-time notification
                    await websocket_manager.send_notification(
                        previous_bidder_email,
                        {
                            "notification_id": notification.NotificationID,
                            "auction_id": auction.AuctionID,
                            "message": message,
                            "sent_date": notification.TimeSent.isoformat(),
                            "is_read": False
                        }
                    )
            else:
                # Just update the auction without notification
                for key, value in bid_info.model_dump().items():
                    setattr(auction, key, value)
                auction.HighestBid = bid_info.BidAmount
                auction.HighestBidderID = user_id
                self.db.commit()
                self.db.refresh(auction)
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

    def schedule_auction_cleanup(background_tasks: BackgroundTasks, db: Session):
        auction_service = AuctionService(db)
        background_tasks.add_task(auction_service.end_expired_auctions)

    def show_winning_auctions(self, user_id: int):
        """
        Get all auctions that the user has won (status "Closed" and highest bidder ID = user ID)
        Also updates auction status to "Closed" if end time has passed
        """
        # First, update any auctions that have passed their end time
        current_time = datetime.now(ZoneInfo("Asia/Singapore"))
        expired_auctions = (
            self.db.query(Auction)
            .filter(
                Auction.EndTime < current_time,
                Auction.Status != "Closed"  # Only update if not already closed
            )
            .all()
        )

        for auction in expired_auctions:
            auction.Status = "Closed"
            self.db.commit()

        # Then get all winning auctions
        winning_auctions = (
            self.db.query(
                Auction.AuctionID,
                Auction.CardID,
                Auction.Status,
                Auction.HighestBid,
                Auction.EndTime,
                Auction.SellerID,
                Card.IsValidated,
                Card.CardName,
                Card.CardQuality,
                Card.ImageURL,
            )
            .join(Card, Auction.CardID == Card.CardID)
            .filter(Auction.Status == "Closed", Auction.HighestBidderID == user_id)
            .order_by(Auction.EndTime.desc())
            .all()
        )

        return [
            dict(
                zip(
                    [
                        "AuctionID",
                        "CardID",
                        "Status",
                        "HighestBid",
                        "EndTime",
                        "SellerID",
                        "IsValidated",
                        "CardName",
                        "CardQuality",
                        "ImageURL",
                    ],
                    row,
                )
            )
            for row in winning_auctions
        ]

    def is_card_available_for_auction(self, card_id: int) -> bool:
        """
        Check if a card is available for auction by checking if it's in a closed auction with a highest bidder
        """
        closed_auction = (
            self.db.query(Auction)
            .filter(
                Auction.CardID == card_id,
                Auction.Status == "Closed",
                Auction.HighestBidderID.isnot(None)
            )
            .first()
        )
        return closed_auction is None


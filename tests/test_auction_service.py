import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock, AsyncMock
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi import HTTPException

from app.models.card import Card
from app.models.profile import Profile
from app.models.auction import Auction, AuctionBid
from app.models.notifications import Notification
from app.services.auction_service import AuctionService
from app.services.profile_service import ProfileService
from app.services.websocket_manager import websocket_manager

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def auction_service(mock_db):
    service = AuctionService(db=mock_db)
    service.websocket_manager = Mock()
    return service

@pytest.fixture
def mock_profile_service():
    mock = Mock(spec=ProfileService)
    mock.get_profile_id.return_value = 1  # Default user_id
    return mock

@pytest.fixture
def test_data():
    """Fixture providing common test data"""
    current_time = datetime.now()
    return {
        "user_id": 1,
        "bidder_id": 2,
        "cognito_user_id": "cognito_12345",
        "card_id": 101,
        "auction_id": 201,
        "current_time": current_time,
        "future_time": current_time + timedelta(days=1),
        "past_time": current_time - timedelta(days=1)
    }

@pytest.mark.asyncio
async def test_update_auction_status_in_progress(auction_service, mock_db, test_data):
    """
    Test updating auction status to 'In Progress'
    """
    # 1) Arrange
    current_time = test_data["current_time"]
    future_time = test_data["future_time"]
    
    # Create mock auction that should remain in progress
    mock_auction = Mock(
        AuctionID=test_data["auction_id"],
        CardID=test_data["card_id"],
        Status="Unknown",  # Should be updated to "In Progress"
        EndTime=future_time,
        HighestBidderID=None,
        HighestBid=100.0
    )
    
    # Mock card for the auction
    mock_card = Mock(
        CardID=test_data["card_id"],
        CardName="Test Card"
    )
    
    # Set up mock queries
    mock_db.query.return_value.all.return_value = [mock_auction]
    mock_db.query.return_value.filter.return_value.first.return_value = mock_card
    
    # Mock the datetime.now method in ZoneInfo
    mock_datetime = Mock()
    mock_datetime.replace.return_value = current_time
    auction_service._get_current_time = Mock(return_value=current_time)
    
    # 2) Act
    await auction_service.update_auction_status()
    
    # 3) Assert
    assert mock_auction.Status == "In Progress"
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_auction)
    
    # No notifications should be created
    mock_db.add.assert_not_called()
    auction_service.websocket_manager.send_notification.assert_not_called()

@pytest.mark.asyncio
async def test_update_auction_status_closed_with_bid(auction_service, mock_db, test_data):
    """
    Test updating auction status to 'Closed' (ended with highest bidder)
    """
    # 1) Arrange
    current_time = test_data["current_time"]
    past_time = test_data["past_time"]
    bidder_id = test_data["bidder_id"]
    seller_id = test_data["user_id"]
    
    # Create mock auction that should be closed
    mock_auction = Mock(
        AuctionID=test_data["auction_id"],
        CardID=test_data["card_id"],
        Status="In Progress",  # Should change to "Closed"
        EndTime=past_time,
        SellerID=seller_id,
        HighestBidderID=bidder_id,
        HighestBid=150.0
    )
    
    # Mock card for the auction
    mock_card = Mock(
        CardID=test_data["card_id"],
        CardName="Test Card"
    )
    
    # Mock profiles for bidder and seller
    mock_bidder_profile = Mock(
        UserID=bidder_id,
        Email="bidder@example.com"
    )
    
    mock_seller_profile = Mock(
        UserID=seller_id,
        Email="seller@example.com"
    )
    
    # Set up mock queries - need to get card, then bidder profile, then seller profile
    mock_db.query.return_value.all.return_value = [mock_auction]
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_card,  # First query is for the card
        mock_bidder_profile,  # Second query is for the bidder profile
        mock_seller_profile  # Third query is for the seller profile
    ]
    
    # Track notifications for assertions
    mock_notifications = []
    
    # Mock add method to capture notifications
    def mock_add_side_effect(notification):
        # Add TimeSent field to avoid isoformat() error
        notification.TimeSent = datetime.now()
        notification.NotificationID = len(mock_notifications) + 1
        mock_notifications.append(notification)
        return notification
        
    mock_db.add.side_effect = mock_add_side_effect
    
    # Mock the datetime.now method
    auction_service._get_current_time = Mock(return_value=current_time)
    
    # Set up websocket manager mock
    auction_service.websocket_manager.send_notification = AsyncMock()
    
    # 2) Act
    await auction_service.update_auction_status()
    
    # 3) Assert
    assert mock_auction.Status == "Closed"
    
    # Two notifications should be created (one for bidder, one for seller)
    assert len(mock_notifications) == 2
    
    # Bidder notification
    bidder_notification = mock_notifications[0]
    assert bidder_notification.ReceiverID == bidder_id
    assert bidder_notification.AuctionID == test_data["auction_id"]
    assert "won the auction" in bidder_notification.Message
    
    # Seller notification
    seller_notification = mock_notifications[1]
    assert seller_notification.ReceiverID == seller_id
    assert seller_notification.AuctionID == test_data["auction_id"]
    assert "has ended" in seller_notification.Message
    
    # Verify websocket notifications were sent
    assert auction_service.websocket_manager.send_notification.call_count == 2

@pytest.mark.asyncio
async def test_update_auction_status_expired_no_bid(auction_service, mock_db, test_data):
    """
    Test updating auction status to 'Expired' (ended with no bids)
    """
    # 1) Arrange
    current_time = test_data["current_time"]
    past_time = test_data["past_time"]
    seller_id = test_data["user_id"]
    
    # Create mock auction that should expire
    mock_auction = Mock(
        AuctionID=test_data["auction_id"],
        CardID=test_data["card_id"],
        Status="In Progress",  # Should change to "Expired"
        EndTime=past_time,
        SellerID=seller_id,
        HighestBidderID=None,  # No bidder
        HighestBid=100.0
    )
    
    # Mock card for the auction
    mock_card = Mock(
        CardID=test_data["card_id"],
        CardName="Test Card"
    )
    
    # Mock profile for seller
    mock_seller_profile = Mock(
        UserID=seller_id,
        Email="seller@example.com"
    )
    
    # Set up mock queries
    mock_db.query.return_value.all.return_value = [mock_auction]
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_card,  # First query is for the card
        mock_seller_profile  # Second query is for the seller profile
    ]
    
    # Track notifications for assertions
    mock_notifications = []
    
    # Mock add method to capture notifications
    def mock_add_side_effect(notification):
        # Add TimeSent field to avoid isoformat() error
        notification.TimeSent = datetime.now()
        notification.NotificationID = len(mock_notifications) + 1
        mock_notifications.append(notification)
        return notification
        
    mock_db.add.side_effect = mock_add_side_effect
    
    # Mock the datetime.now method
    auction_service._get_current_time = Mock(return_value=current_time)
    
    # Set up websocket manager mock
    auction_service.websocket_manager.send_notification = AsyncMock()
    
    # 2) Act
    await auction_service.update_auction_status()
    
    # 3) Assert
    assert mock_auction.Status == "Expired"
    
    # One notification should be created (for seller)
    assert len(mock_notifications) == 1
    
    # Seller notification
    seller_notification = mock_notifications[0]
    assert seller_notification.ReceiverID == seller_id
    assert seller_notification.AuctionID == test_data["auction_id"]
    assert "ended with no bids" in seller_notification.Message
    
    # Verify websocket notification was sent to seller
    auction_service.websocket_manager.send_notification.assert_called_once()

def test_get_auctions_details_auction_not_found(auction_service, mock_db, test_data):
    """
    Test getting auction details when auction does not exist
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.get_auctions_details(auction_id)
    
    # Verify exception
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Auction not found"

def test_get_auctions_details_card_not_found(auction_service, mock_db, test_data):
    """
    Test getting auction details when card does not exist
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    card_id = test_data["card_id"]
    current_time = test_data["current_time"]
    
    mock_auction = Mock(
        AuctionID=auction_id,
        CardID=card_id,
        EndTime=current_time + timedelta(days=1),
        HighestBid=100.0,
        Status="Unknown"
    )
    
    # Configure mocks to return auction but no card
    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_auction, None]
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.get_auctions_details(auction_id)
    
    # Verify exception
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Card not found"

def test_get_auctions_details_in_progress(auction_service, mock_db, test_data):
    """
    Test getting auction details for an in-progress auction
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    card_id = test_data["card_id"]
    user_id = test_data["user_id"]
    current_time = test_data["current_time"]
    
    mock_auction = Mock(
        AuctionID=auction_id,
        CardID=card_id,
        SellerID=user_id,
        MinimumIncrement=10.0,
        EndTime=current_time + timedelta(days=1),
        Status="Unknown",
        HighestBidderID=None,
        HighestBid=100.0
    )
    
    mock_card = Mock(
        CardID=card_id,
        CardName="Test Card",
        CardQuality="Mint",
        IsValidated=True,
        ImageURL="image.jpg"
    )
    
    # Configure mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_auction, mock_card]
    
    # Mock datetime for comparison in the method
    auction_service._get_current_time = Mock(return_value=current_time)
    
    # 2) Act
    result = auction_service.get_auctions_details(auction_id)
    
    # 3) Assert
    assert mock_auction.Status == "In Progress"
    
    assert result["AuctionID"] == auction_id
    assert result["CardID"] == card_id
    assert result["CardName"] == "Test Card"
    assert result["Status"] == "In Progress"
    assert result["ImageURL"] == "image.jpg"
    
    # Verify commit and refresh were called
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_auction)

def test_unvalidated_cards_cannot_be_auctioned(auction_service, mock_db, test_data):
    """
    Test that unvalidated cards cannot be put up for auction
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    card_id = test_data["card_id"]
    
    # Create unvalidated card
    unvalidated_card = Mock(
        CardID=card_id,
        OwnerID=user_id,
        CardName="Unvalidated Card",
        IsValidated=False
    )
    
    # Mock for unvalidated card test
    mock_db.query.return_value.filter.return_value.first.return_value = unvalidated_card
    
    # 2) Act & Assert
    # Test with unvalidated card - should fail
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id, 
            card_id,  # The unvalidated card
            100.0, 
            10.0, 
            24.0
        )
    
    # 3) Assert
    # Verify exception details
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Card is not validated and cannot be used for auction"
    
    # Verify auction was not created
    mock_db.add.assert_not_called()

def test_create_auction_card_already_in_auction(auction_service, mock_db, test_data):
    """
    Test creating an auction for a card already in an auction
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    card_id = test_data["card_id"]
    
    mock_card = Mock(
        CardID=card_id,
        OwnerID=user_id,
        IsValidated=True
    )
    
    mock_existing_auction = Mock()
    
    # Configure mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_card, mock_existing_auction]
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id, 
            card_id, 
            100.0, 
            10.0, 
            24.0
        )
    
    # Verify exception
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Card is already in an auction that is in progress"

def test_create_auction_invalid_starting_bid(auction_service, mock_db, test_data):
    """
    Test creating an auction with invalid starting bid
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    card_id = test_data["card_id"]
    
    mock_card = Mock(
        CardID=card_id,
        OwnerID=user_id,
        IsValidated=True
    )
    
    # Configure mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_card, None]
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id, 
            card_id, 
            0.0,  # Invalid starting bid
            10.0, 
            24.0
        )
    
    # Verify exception
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Starting bid must be greater than zero!"

def test_create_auction_success(auction_service, mock_db, test_data):
    """
    Test successfully creating an auction
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    card_id = test_data["card_id"]
    current_time = test_data["current_time"]
    
    mock_card = Mock(
        CardID=card_id,
        OwnerID=user_id,
        IsValidated=True
    )
    
    # Configure mocks
    mock_db.query.return_value.filter.return_value.first.side_effect = [mock_card, None]
    
    # Mock datetime.now() for the test
    auction_service._get_current_time = Mock(return_value=current_time)
    
    # 2) Act
    result = auction_service.create_auction(
        user_id, 
        card_id, 
        100.0, 
        10.0, 
        24.0
    )
    
    # 3) Assert
    # Verify auction was added, committed, and refreshed
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    
    # Verify correct auction data was passed
    added_auction = mock_db.add.call_args[0][0]
    assert added_auction.CardID == card_id
    assert added_auction.SellerID == user_id
    assert added_auction.MinimumIncrement == 10.0
    assert added_auction.HighestBid == 100.0
    assert added_auction.Status == "In Progress"

@pytest.mark.asyncio
async def test_bid_auction_not_found(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test bidding on an auction that doesn't exist
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Mock the get_auction_by_id method
    auction_service.get_auction_by_id = Mock(return_value=None)
    
    # Create bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 200.0
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auction_service.bid_auction(
            cognito_user_id, 
            bid_info, 
            mock_profile_service
        )
    
    # Verify exception
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Auction not found"

@pytest.mark.asyncio
async def test_bid_auction_seller_bidding(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test seller trying to bid on their own auction
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    user_id = test_data["user_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Mock the get_auction_by_id method to return our mock auction directly
    auction_service.get_auction_by_id = Mock(return_value=Mock(
        AuctionID=auction_id,
        SellerID=user_id,  # Same as user_id returned by profile service
        Status="In Progress"
    ))
    
    # Create bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 200.0
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auction_service.bid_auction(
            cognito_user_id, 
            bid_info, 
            mock_profile_service
        )
    
    # Verify exception
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Seller cannot bid on their own auction"

@pytest.mark.asyncio
async def test_bid_auction_closed(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test bidding on a closed auction
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Mock the get_auction_by_id method to return our mock auction directly
    auction_service.get_auction_by_id = Mock(return_value=Mock(
        AuctionID=auction_id,
        SellerID=999,  # Different from user_id
        Status="Closed"
    ))
    
    # Create bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 200.0
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auction_service.bid_auction(
            cognito_user_id, 
            bid_info, 
            mock_profile_service
        )
    
    # Verify exception
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Cannot bid on a closed auction"

@pytest.mark.asyncio
async def test_bid_auction_too_low(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test bidding with an amount that's too low
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Mock the get_auction_by_id method to return our mock auction directly
    auction_service.get_auction_by_id = Mock(return_value=Mock(
        AuctionID=auction_id,
        SellerID=999,  # Different from user_id
        Status="In Progress",
        HighestBid=100.0,
        MinimumIncrement=10.0
    ))
    
    # Create bid info with too low amount
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 105.0  # Less than 100 + 10
    
    # 2) Act
    result = await auction_service.bid_auction(
        cognito_user_id, 
        bid_info, 
        mock_profile_service
    )
    
    # 3) Assert
    assert result is None  # Bid too low
    
    # Verify auction was not updated
    mock_db.commit.assert_not_called()

@pytest.mark.asyncio
async def test_bid_auction_success_no_previous_bidder(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test successful bidding with no previous highest bidder
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    user_id = test_data["user_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Create a mock auction
    mock_auction = Mock(
        AuctionID=auction_id,
        SellerID=999,  # Different from user_id
        Status="In Progress",
        HighestBid=100.0,
        MinimumIncrement=10.0,
        HighestBidderID=None  # No previous bidder
    )
    
    # Mock the get_auction_by_id method to return our mock auction directly
    auction_service.get_auction_by_id = Mock(return_value=mock_auction)
    
    # Configure bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 150.0
    bid_info.model_dump = Mock(return_value={"AuctionID": auction_id, "BidAmount": 150.0})
    
    # 2) Act
    result = await auction_service.bid_auction(
        cognito_user_id, 
        bid_info, 
        mock_profile_service
    )
    
    # 3) Assert
    assert mock_auction.HighestBid == 150.0
    assert mock_auction.HighestBidderID == user_id
    
    # Verify commit and refresh were called
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_auction)
    
    # Verify no notification was added (since no previous bidder)
    mock_db.add.assert_not_called()
    
    # Verify result is the updated auction
    assert result == mock_auction

def test_show_winning_auctions(auction_service, mock_db, test_data):
    """
    Test retrieving auctions that a user has won
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    auction_id = test_data["auction_id"]
    card_id = test_data["card_id"]
    current_time = test_data["current_time"]
    
    # Mock auctions to close
    mock_expired_auctions = [
        Mock(
            AuctionID=auction_id,
            Status="In Progress",
            EndTime=current_time - timedelta(hours=1),
            HighestBidderID=user_id
        )
    ]
    
    # Mock winning auctions query result
    mock_winning_auctions = [
        (auction_id, card_id, "Closed", 150.0, current_time - timedelta(hours=1), 999, True, "Test Card", "Mint", "image.jpg")
    ]
    
    # Configure mocks
    mock_db.query.return_value.filter.return_value.all.return_value = mock_expired_auctions
    mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value.all.return_value = mock_winning_auctions
    
    # Mock datetime.now for the method
    auction_service._get_current_time = Mock(return_value=current_time)
    
    # 2) Act
    result = auction_service.show_winning_auctions(user_id)
    
    # 3) Assert
    # Verify auctions were updated to "Closed"
    for auction in mock_expired_auctions:
        assert auction.Status == "Closed"
    
    # Verify result contains expected data
    assert len(result) == 1
    assert result[0]["AuctionID"] == auction_id
    assert result[0]["CardID"] == card_id
    assert result[0]["Status"] == "Closed"
    assert result[0]["CardName"] == "Test Card"
    assert result[0]["ImageURL"] == "image.jpg"
    
    # Verify commit was called to update auction status
    mock_db.commit.assert_called_once()

def test_is_card_available_for_auction(auction_service, mock_db, test_data):
    """
    Test checking if a card is available for auction
    """
    # 1) Arrange
    card_id = test_data["card_id"]
    
    # 2) Act & Assert
    # Test when card is not in a closed auction with a highest bidder
    mock_db.query.return_value.filter.return_value.first.return_value = None
    assert auction_service.is_card_available_for_auction(card_id) is True
    
    # Test when card is in a closed auction with a highest bidder
    mock_db.query.return_value.filter.return_value.first.return_value = Mock()
    assert auction_service.is_card_available_for_auction(card_id) is False
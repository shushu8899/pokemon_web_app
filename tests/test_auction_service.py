import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models.card import Card
from app.models.auction import Auction, AuctionBid
from app.models.notifications import Notification
from app.services.auction_service import AuctionService
from app.services.profile_service import ProfileService

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def auction_service(mock_db):
    return AuctionService(db=mock_db)

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
        "cognito_user_id": "cognito_12345",
        "card_id": 101,
        "auction_id": 201,
        "current_time": current_time,
        "future_time": current_time + timedelta(days=1),
        "past_time": current_time - timedelta(days=1)
    }

def test_get_auctions_by_page(auction_service, mock_db, test_data):
    """
    Test retrieving auctions by page with pagination
    """
    # 1) Arrange
    page = 1
    page_size = 10
    current_time = test_data["current_time"]
    mock_results = [
        (201, 101, "In Progress", current_time + timedelta(days=1), 100.0, True, "Test Card", "Mint", "image.jpg"),
        (202, 102, "In Progress", current_time + timedelta(days=2), 150.0, True, "Test Card 2", "Near Mint", "image2.jpg")
    ]
    
    mock_db.query.return_value.join.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = mock_results
    
    # 2) Act
    result = auction_service.get_auctions_by_page(page, page_size)
    
    # 3) Assert
    assert len(result) == 2
    assert result[0]["AuctionID"] == 201
    assert result[0]["CardName"] == "Test Card"
    assert result[1]["AuctionID"] == 202
    assert result[1]["CardName"] == "Test Card 2"
    
    # Verify query was called with correct pagination
    mock_db.query.assert_called_once()
    mock_db.query.return_value.join.return_value.order_by.return_value.offset.assert_called_once_with(0)
    mock_db.query.return_value.join.return_value.order_by.return_value.offset.return_value.limit.assert_called_once_with(page_size)

def test_update_auction_status(auction_service, mock_db, test_data):
    """
    Test updating auction statuses based on end time
    """
    # 1) Arrange
    current_time = test_data["current_time"]
    # Mock auctions with different end times and bid amounts
    mock_auctions = [
        Mock(EndTime=current_time + timedelta(days=1), HighestBid=100.0, Status="Unknown"),  # Should be In Progress
        Mock(EndTime=current_time - timedelta(days=1), HighestBid=100.0, Status="Unknown"),  # Should be Closed
        Mock(EndTime=current_time - timedelta(days=1), HighestBid=0.0, Status="Unknown")     # Should be Expired
    ]
    
    mock_db.query.return_value.all.return_value = mock_auctions
    
    # 2) Act
    auction_service.update_auction_status()
    
    # 3) Assert
    assert mock_auctions[0].Status == "In Progress"
    assert mock_auctions[1].Status == "Closed"
    assert mock_auctions[2].Status == "Expired"
    
    # Verify commit was called
    mock_db.commit.assert_called_once()

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
    
    # 2) Act
    result = auction_service.get_auctions_details(auction_id)
    
    # 3) Assert
    assert mock_auction.Status == "In Progress"
    
    assert result["AuctionID"] == auction_id
    assert result["CardID"] == card_id
    assert result["CardName"] == "Test Card"
    assert result["Status"] == "In Progress"
    
    # Verify commit and refresh were called
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_auction)

def test_create_auction_card_not_found(auction_service, mock_db, test_data):
    """
    Test creating an auction when card does not exist or user doesn't own it
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    card_id = test_data["card_id"]
    
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
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
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Card not found or you do not have permission to use this card"

def test_create_auction_card_not_validated(auction_service, mock_db, test_data):
    """
    Test creating an auction with a non-validated card
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    card_id = test_data["card_id"]
    
    mock_card = Mock(
        CardID=card_id,
        OwnerID=user_id,
        IsValidated=False
    )
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_card
    
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
    assert exc_info.value.detail == "Card is not validated and cannot be used for auction"

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

def test_create_auction_invalid_minimum_increment(auction_service, mock_db, test_data):
    """
    Test creating an auction with invalid minimum increment
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
            100.0, 
            0.0,  # Invalid minimum increment
            24.0
        )
    
    # Verify exception
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Minimum increment must be greater than zero!"

def test_create_auction_success(auction_service, mock_db, test_data):
    """
    Test successfully creating an auction
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

def test_bid_auction_not_found(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test bidding on an auction that doesn't exist
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    # Create bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 200.0
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.bid_auction(
            cognito_user_id, 
            bid_info, 
            mock_profile_service
        )
    
    # Verify exception
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Auction not found"

def test_bid_auction_seller_bidding(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test seller trying to bid on their own auction
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    user_id = test_data["user_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Mock the get_auction_by_id method to return our mock auction directly
    # This avoids the datetime comparison issue in _update_auction_status
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
        auction_service.bid_auction(
            cognito_user_id, 
            bid_info, 
            mock_profile_service
        )
    
    # Verify exception
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Seller cannot bid on their own auction"

def test_bid_auction_closed(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test bidding on a closed auction
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Mock the get_auction_by_id method to return our mock auction directly
    # This avoids the datetime comparison issue in _update_auction_status
    auction_service.get_auction_by_id = Mock(return_value=Mock(
        AuctionID=auction_id,
        SellerID=2,  # Different from user_id
        Status="Closed"
    ))
    
    # Create bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 200.0
    
    # 2) Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.bid_auction(
            cognito_user_id, 
            bid_info, 
            mock_profile_service
        )
    
    # Verify exception
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Cannot bid on a closed auction"

def test_bid_auction_too_low(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test bidding with an amount that's too low
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    cognito_user_id = test_data["cognito_user_id"]
    
    # Mock the get_auction_by_id method to return our mock auction directly
    # This avoids the datetime comparison issue in _update_auction_status
    auction_service.get_auction_by_id = Mock(return_value=Mock(
        AuctionID=auction_id,
        SellerID=2,  # Different from user_id
        Status="In Progress",
        HighestBid=100.0,
        MinimumIncrement=10.0
    ))
    
    # Create bid info with too low amount
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 105.0  # Less than 100 + 10
    
    # 2) Act
    result = auction_service.bid_auction(
        cognito_user_id, 
        bid_info, 
        mock_profile_service
    )
    
    # 3) Assert
    assert result is None  # Bid too low
    
    # Verify auction was not updated
    mock_db.commit.assert_not_called()

def test_bid_auction_success_no_previous_bidder(auction_service, mock_db, mock_profile_service, test_data):
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
        SellerID=2,  # Different from user_id
        Status="In Progress",
        HighestBid=100.0,
        MinimumIncrement=10.0,
        HighestBidderID=None  # No previous bidder
    )
    
    # Mock the get_auction_by_id method to return our mock auction directly
    # This avoids the datetime comparison issue in _update_auction_status
    auction_service.get_auction_by_id = Mock(return_value=mock_auction)
    
    # Configure bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 150.0
    bid_info.model_dump.return_value = {"AuctionID": auction_id, "BidAmount": 150.0}
    
    # 2) Act
    result = auction_service.bid_auction(
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

def test_bid_auction_success_with_previous_bidder(auction_service, mock_db, mock_profile_service, test_data):
    """
    Test successful bidding with a previous highest bidder
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    user_id = test_data["user_id"]
    cognito_user_id = test_data["cognito_user_id"]
    previous_bidder_id = 3
    
    # Create a mock auction
    mock_auction = Mock(
        AuctionID=auction_id,
        SellerID=2,  # Different from user_id
        Status="In Progress",
        HighestBid=100.0,
        MinimumIncrement=10.0,
        HighestBidderID=previous_bidder_id  # Previous bidder exists
    )
    
    # Mock the get_auction_by_id method to return our mock auction directly
    # This avoids the datetime comparison issue in _update_auction_status
    auction_service.get_auction_by_id = Mock(return_value=mock_auction)
    
    # Configure bid info
    bid_info = Mock()
    bid_info.AuctionID = auction_id
    bid_info.BidAmount = 150.0
    bid_info.model_dump.return_value = {"AuctionID": auction_id, "BidAmount": 150.0}
    
    # 2) Act
    result = auction_service.bid_auction(
        cognito_user_id, 
        bid_info, 
        mock_profile_service
    )
    
    # 3) Assert
    assert mock_auction.HighestBid == 150.0
    assert mock_auction.HighestBidderID == user_id
    
    # Verify notification was added
    mock_db.add.assert_called_once()
    notification = mock_db.add.call_args[0][0]
    assert isinstance(notification, Notification)
    assert notification.BidderID == previous_bidder_id
    assert notification.AuctionID == auction_id
    assert "You have been outbid! New highest bid: $150.0" in notification.Message
    
    # Verify commit was called twice (once for auction update, once for notification)
    assert mock_db.commit.call_count == 2
    
    # Verify result is the updated auction
    assert result == mock_auction

def test_end_expired_auctions(auction_service, mock_db, test_data):
    """
    Test ending expired auctions
    """
    # 1) Arrange
    auction_id = test_data["auction_id"]
    card_id = test_data["card_id"]
    now = datetime.now()
    
    # Mock expired auctions
    mock_expired_auctions = [
        Mock(
            AuctionID=auction_id,
            CardID=card_id,
            Status="In Progress",
            EndTime=now - timedelta(hours=1),
            HighestBidderID=3,
            HighestBid=150.0,
            SellerID=2
        ),
        Mock(
            AuctionID=auction_id + 1,
            CardID=card_id + 1,
            Status="In Progress",
            EndTime=now - timedelta(hours=2),
            HighestBidderID=None,  # No highest bidder
            HighestBid=0.0,
            SellerID=2
        )
    ]
    
    mock_db.query.return_value.filter.return_value.all.return_value = mock_expired_auctions
    
    # 2) Act
    auction_service.end_expired_auctions()
    
    # 3) Assert
    # Verify auctions were updated to "Ended"
    for auction in mock_expired_auctions:
        assert auction.Status == "Ended"
    
    # Verify notifications were created
    # First auction: 1 for bidder + 1 for seller = 2
    # Second auction: Only 1 for seller (no bidder) = 1
    # Total: 3 notifications
    assert mock_db.add.call_count == 3
    
    # Verify expected commit calls
    # Looking at the actual implementation:
    # 1. First auction: 1 commit after status update + 1 commit after notifications = 2
    # 2. Second auction: 1 commit after status update + 1 commit after notifications = 2
    # Total: 4 commit calls
    assert mock_db.commit.call_count == 4

def test_show_winning_auctions(auction_service, mock_db, test_data):
    """
    Test retrieving auctions that a user has won
    """
    # 1) Arrange
    user_id = test_data["user_id"]
    auction_id = test_data["auction_id"]
    card_id = test_data["card_id"]
    now = datetime.now()
    
    # Mock auctions to close
    mock_auctions_to_close = [
        Mock(
            AuctionID=auction_id,
            Status="In Progress",
            EndTime=now - timedelta(hours=1),
            HighestBidderID=user_id,
            HighestBid=150.0
        )
    ]
    
    # Mock winning auctions query result
    mock_winning_auctions = [
        (auction_id, card_id, "Closed", 150.0, now - timedelta(hours=1), 2, True, "Test Card", "Mint", "image.jpg")
    ]
    
    # Configure mocks
    mock_db.query.return_value.filter.return_value.all.return_value = mock_auctions_to_close
    mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value.all.return_value = mock_winning_auctions
    
    # 2) Act
    result = auction_service.show_winning_auctions(user_id)
    
    # 3) Assert
    # Verify auctions were updated to "Closed" and notifications were created
    for auction in mock_auctions_to_close:
        assert auction.Status == "Closed"
    mock_db.add.assert_called_once()  # One notification for the winner
    
    # Verify result contains expected data
    assert len(result) == 1
    assert result[0]["AuctionID"] == auction_id
    assert result[0]["CardID"] == card_id
    assert result[0]["Status"] == "Closed"
    assert result[0]["CardName"] == "Test Card"
    
    # Based on the actual implementation, there should be just 1 commit call
    # after adding the notification
    assert mock_db.commit.call_count == 1

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
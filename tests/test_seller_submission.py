import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock
from app.exceptions import ServiceException

from app.services.profile_service import ProfileService
from app.services.auction_service import AuctionService
from app.models.profile import Profile, ProfileInfo
from app.models.card import Card, CardInfo
from app.models.auction import Auction, AuctionInfo
from datetime import datetime, timedelta
from fastapi import HTTPException

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def auction_service(mock_db):
    return AuctionService(db=mock_db)

def test_create_auction_success(auction_service, mock_db, monkeypatch):
    # Arrange
    user_id = 1
    card_id = 101
    starting_bid = 10.0
    minimum_increment = 1.0
    auction_duration = 24.0
    
    valid_card = Mock()
    valid_card.CardID = card_id
    valid_card.OwnerID = user_id
    valid_card.IsValidated = True
    
    # First query: Card check - returns valid card
    card_query_mock = Mock()
    card_filter_mock = Mock()
    card_filter_mock.first.return_value = valid_card
    card_query_mock.filter.return_value = card_filter_mock
    
    # Second query: Auction check - returns None (no existing auction)
    auction_query_mock = Mock()
    auction_filter_mock = Mock()
    auction_filter_mock.first.return_value = None
    auction_query_mock.filter.return_value = auction_filter_mock
    
    # Setup side effect for consecutive calls to query
    mock_db.query.side_effect = [card_query_mock, auction_query_mock]
    
    # Fix datetime.now for testing
    now = datetime(2023, 1, 1, 12, 0)
    expected_end_time = now + timedelta(hours=auction_duration)
    monkeypatch.setattr('app.services.auction_service.datetime', Mock(now=Mock(return_value=now)))
    
    # Act
    result = auction_service.create_auction(
        user_id,
        card_id,
        starting_bid,
        minimum_increment,
        auction_duration
    )
    
    # Assert
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    
    # Get the auction object that was passed to db.add
    auction_data = mock_db.add.call_args[0][0]
    assert auction_data.CardID == card_id
    assert auction_data.SellerID == user_id
    assert auction_data.MinimumIncrement == minimum_increment
    assert auction_data.EndTime == expected_end_time
    assert auction_data.Status == "In Progress"
    assert auction_data.HighestBidderID is None
    assert auction_data.HighestBid == starting_bid

def test_card_not_found(auction_service, mock_db):
    # Arrange
    user_id = 1
    card_id = 101
    starting_bid = 10.0
    minimum_increment = 1.0
    auction_duration = 24.0
    
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id,
            card_id,
            starting_bid,
            minimum_increment,
            auction_duration
        )
    
    assert exc_info.value.status_code == 404
    assert "Card not found or you do not have permission" in exc_info.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()

def test_card_not_validated(auction_service, mock_db):
    # Arrange
    user_id = 1
    card_id = 101
    starting_bid = 10.0
    minimum_increment = 1.0
    auction_duration = 24.0
    
    non_validated_card = Mock()
    non_validated_card.CardID = card_id
    non_validated_card.OwnerID = user_id
    non_validated_card.IsValidated = False
    
    mock_db.query.return_value.filter.return_value.first.return_value = non_validated_card
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id,
            card_id,
            starting_bid,
            minimum_increment,
            auction_duration
        )
    
    assert exc_info.value.status_code == 400
    assert "Card is not validated" in exc_info.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()

def test_card_already_in_auction(auction_service, mock_db):
    # Arrange
    user_id = 1
    card_id = 101
    starting_bid = 10.0
    minimum_increment = 1.0
    auction_duration = 24.0
    
    # Create valid card mock
    valid_card = Mock()
    valid_card.CardID = card_id
    valid_card.OwnerID = user_id
    valid_card.IsValidated = True
    
    # Create existing auction mock
    existing_auction = Mock()
    existing_auction.Status = "In Progress"
    
    # Setup query mocks based on the actual sequence in the code
    # First query: Card check - returns valid card
    first_query_mock = Mock()
    first_filter_mock = Mock()
    first_filter_mock.first.return_value = valid_card
    first_query_mock.filter.return_value = first_filter_mock
    
    # Second query: Auction check - returns existing auction
    second_query_mock = Mock()
    second_filter_mock = Mock()
    second_filter_mock.first.return_value = existing_auction
    second_query_mock.filter.return_value = second_filter_mock
    
    # Setup side effect for consecutive calls to query
    mock_db.query.side_effect = [first_query_mock, second_query_mock]
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id,
            card_id,
            starting_bid,
            minimum_increment,
            auction_duration
        )
    
    assert exc_info.value.status_code == 400
    assert "Card is already in an auction that is in progress" in exc_info.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()

def test_invalid_starting_bid(auction_service, mock_db):
    # Arrange
    user_id = 1
    card_id = 101
    starting_bid = 0.0  # Invalid value
    minimum_increment = 1.0
    auction_duration = 24.0
    
    valid_card = Mock()
    valid_card.CardID = card_id
    valid_card.OwnerID = user_id
    valid_card.IsValidated = True
    
    # First query: Card check - returns valid card
    card_query_mock = Mock()
    card_filter_mock = Mock()
    card_filter_mock.first.return_value = valid_card
    card_query_mock.filter.return_value = card_filter_mock
    
    # Second query: Auction check - returns None (no existing auction)
    auction_query_mock = Mock()
    auction_filter_mock = Mock()
    auction_filter_mock.first.return_value = None
    auction_query_mock.filter.return_value = auction_filter_mock
    
    # Setup side effect for consecutive calls to query
    mock_db.query.side_effect = [card_query_mock, auction_query_mock]
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id,
            card_id,
            starting_bid,
            minimum_increment,
            auction_duration
        )
    
    assert exc_info.value.status_code == 400
    assert "Starting bid must be greater than zero" in exc_info.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()

def test_invalid_minimum_increment(auction_service, mock_db):
    # Arrange
    user_id = 1
    card_id = 101
    starting_bid = 10.0
    minimum_increment = 0.0  # Invalid value
    auction_duration = 24.0
    
    valid_card = Mock()
    valid_card.CardID = card_id
    valid_card.OwnerID = user_id
    valid_card.IsValidated = True
    
    # First query: Card check - returns valid card
    card_query_mock = Mock()
    card_filter_mock = Mock()
    card_filter_mock.first.return_value = valid_card
    card_query_mock.filter.return_value = card_filter_mock
    
    # Second query: Auction check - returns None (no existing auction)
    auction_query_mock = Mock()
    auction_filter_mock = Mock()
    auction_filter_mock.first.return_value = None
    auction_query_mock.filter.return_value = auction_filter_mock
    
    # Setup side effect for consecutive calls to query
    mock_db.query.side_effect = [card_query_mock, auction_query_mock]
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id,
            card_id,
            starting_bid,
            minimum_increment,
            auction_duration
        )
    
    assert exc_info.value.status_code == 400
    assert "Minimum increment must be greater than zero" in exc_info.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()

def test_invalid_auction_duration(auction_service, mock_db, monkeypatch):
    # Arrange
    user_id = 1
    card_id = 101
    starting_bid = 10.0
    minimum_increment = 1.0
    auction_duration = 0.0  # Invalid value
    
    valid_card = Mock()
    valid_card.CardID = card_id
    valid_card.OwnerID = user_id
    valid_card.IsValidated = True
    
    # First query: Card check - returns valid card
    card_query_mock = Mock()
    card_filter_mock = Mock()
    card_filter_mock.first.return_value = valid_card
    card_query_mock.filter.return_value = card_filter_mock
    
    # Second query: Auction check - returns None (no existing auction)
    auction_query_mock = Mock()
    auction_filter_mock = Mock()
    auction_filter_mock.first.return_value = None
    auction_query_mock.filter.return_value = auction_filter_mock
    
    # Setup side effect for consecutive calls to query
    mock_db.query.side_effect = [card_query_mock, auction_query_mock]
    
    # Fix datetime.now for testing
    now = datetime(2023, 1, 1, 12, 0)
    monkeypatch.setattr('app.services.auction_service.datetime', Mock(now=Mock(return_value=now)))
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        auction_service.create_auction(
            user_id,
            card_id,
            starting_bid,
            minimum_increment,
            auction_duration
        )
    
    assert exc_info.value.status_code == 400
    assert "End Time must be later than the current time" in exc_info.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()
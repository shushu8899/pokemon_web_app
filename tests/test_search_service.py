import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock
from app.exceptions import ServiceException
from app.services.search_service import SearchService
from app.models.profile import Profile
from app.models.card import Card
from app.models.auction import Auction
from sqlalchemy import or_

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def search_service(mock_db):
    return SearchService(db=mock_db)

def test_search_all_tables(search_service, mock_db):
    """
    Test that we can query relevant data across all tables
    """
    # 1) Arrange
    # Mock the profile query return  
    mock_db.query.return_value.filter.return_value.all.return_value = [
        Profile(Username="TestUsername1",
                Email="username1@gmail.com",
                NumberOfRating=5,
                CurrentRating=4.0)
    ]
    
    # Mock the card-auction query return
    mock_card = Card(CardID=1, 
                    OwnerID=1,
                    CardName="TestCard1",
                    CardQuality="PSA10",
                    ImageURL="/static/uploads/caebae50-6c65-4c6b-a7eb-2104a85ea75c_pokemoncard_test.png")
    
    mock_auction = Auction(AuctionID=1,
                          SellerID=1,
                          CardID=1,
                          Status="Active test",
                          EndTime="2025-03-24 01:36:33.373247",
                          HighestBid=100.50)
    
    mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = [
        (mock_card, mock_auction)
    ]

    # 2) Act 
    search_result = search_service.search_all_tables("Test")    

    # 3) Assert
    # Check the overall structure
    assert search_result["total"] == 2  # 1 profile + 1 card_auction
    assert search_result["categories"]["profiles"] == 1
    assert search_result["categories"]["card_auctions"] == 1
    
    # Check the profile result
    profile_results = [r for r in search_result["results"] if r.get("result_type") == "Profile"]
    assert len(profile_results) == 1
    assert profile_results[0]["Username"] == "TestUsername1"
    assert profile_results[0]["Email"] == "username1@gmail.com"
    assert profile_results[0]["NumberOfRating"] == 5
    assert profile_results[0]["CurrentRating"] == 4.0
    
    # Check the card_auction result
    card_auction_results = [r for r in search_result["results"] if r.get("result_type") == "CardAuction"]
    assert len(card_auction_results) == 1
    assert card_auction_results[0]["card"]["CardName"] == "TestCard1"
    assert card_auction_results[0]["card"]["CardQuality"] == "PSA10"
    assert card_auction_results[0]["auction"]["AuctionID"] == 1
    assert card_auction_results[0]["auction"]["SellerID"] == 1
    assert card_auction_results[0]["auction"]["Status"] == "Active test"

    # Verify method calls
    mock_db.query.assert_any_call(Profile)
    mock_db.query.assert_any_call(Card, Auction)
    

def test_search_all_tables_no_results(search_service, mock_db):
    """
    Test search with no matches
    """
    # 1) Arrange
    # Mock empty profile query return  
    mock_db.query.return_value.filter.return_value.all.return_value = []
    
    # Mock empty card-auction query return
    mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = []

    # 2) Act 
    search_result = search_service.search_all_tables("justatest")

    # 3) Assert
    assert search_result["total"] == 0
    assert search_result["categories"]["profiles"] == 0
    assert search_result["categories"]["card_auctions"] == 0
    assert len(search_result["results"]) == 0
    
    # Verify method calls
    mock_db.query.assert_any_call(Profile)
    mock_db.query.assert_any_call(Card, Auction)

def test_search_auctions(search_service, mock_db):
    """
    Test the search_auctions method
    """
    # 1) Arrange
    # Mock auction query return
    mock_auction = Auction(AuctionID=101, 
                          CardID=1, 
                          SellerID=1, 
                          EndTime="2025-03-24 01:36:33.373247", 
                          Status="Active", 
                          HighestBid=50.0)
    
    mock_db.query.return_value.filter.return_value.all.return_value = [mock_auction]
    
    # Mock card query return
    mock_card = Card(CardID=1, 
                    OwnerID=1,
                    CardName="TestCard1",
                    CardQuality="Mint",
                    ImageURL="/static/uploads/caebae50-6c65-4c6b-a7eb-2104a85ea75c_pokemoncard_test.png")
    
    mock_db.query.return_value.filter.return_value.first.return_value = mock_card

    # 2) Act
    result = search_service.search_auctions(user_id=1)

    # 3) Assert
    assert len(result) == 1
    assert result[0]["AuctionID"] == 101
    assert result[0]["CardID"] == 1
    assert result[0]["SellerID"] == 1
    assert result[0]["Status"] == "Active"
    assert result[0]["HighestBid"] == 50.0
    assert result[0]["CardName"] == "TestCard1"
    assert result[0]["CardQuality"] == "Mint"
    assert result[0]["ImageURL"] == "test_url.jpg"
    
    # Verify method calls
    mock_db.query.assert_any_call(Auction)
    mock_db.query.assert_any_call(Card)

def test_search_auctions_no_results(search_service, mock_db):
    """
    Test the search_auctions method with no results
    """
    # 1) Arrange
    # Mock empty auction query return
    mock_db.query.return_value.filter.return_value.all.return_value = []

    # 2) Act
    result = search_service.search_auctions(user_id=999)

    # 3) Assert
    assert len(result) == 0
    
    # Verify method calls
    mock_db.query.assert_called_once_with(Auction)

def test_get_card_counts(search_service, mock_db):
    """
    Test the get_card_counts method
    """
    # 1) Arrange
    # Mock the count return
    mock_db.query.return_value.filter.return_value.count.return_value = 5

    # 2) Act
    count = search_service.get_card_counts("test")

    # 3) Assert
    assert count == 5
    
    # Verify method calls
    mock_db.query.assert_called_once_with(Card)
    mock_db.query.return_value.filter.assert_called_once()
    mock_db.query.return_value.filter.return_value.count.assert_called_once()

def test_get_profile_counts(search_service, mock_db):
    """
    Test the get_profile_counts method
    """
    # 1) Arrange
    # Mock the count return
    mock_db.query.return_value.filter.return_value.count.return_value = 3

    # 2) Act
    count = search_service.get_profile_counts("test")

    # 3) Assert
    assert count == 3
    
    # Verify method calls
    mock_db.query.assert_called_once_with(Profile)
    mock_db.query.return_value.filter.assert_called_once()
    mock_db.query.return_value.filter.return_value.count.assert_called_once()

def test_get_auction_counts(search_service, mock_db):
    """
    Test the get_auction_counts method
    """
    # 1) Arrange
    # Mock the count return
    mock_db.query.return_value.filter.return_value.count.return_value = 7

    # 2) Act
    count = search_service.get_auction_counts("test")

    # 3) Assert
    assert count == 7
    
    # Verify method calls
    mock_db.query.assert_called_once_with(Auction)
    mock_db.query.return_value.filter.assert_called_once()
    mock_db.query.return_value.filter.return_value.count.assert_called_once()
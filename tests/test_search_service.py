import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock
from app.exceptions import ServiceException
from app.services.search_service import SearchService
from app.models.profile import Profile, ProfileInfo
from app.models.card import Card, CardInfo
from app.models.auction import Auction, AuctionInfo
from app.models.notifications import Notification, NotificationInfo

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def search_service(mock_db):
    return SearchService(db=mock_db)

def test_get_query(search_service, mock_db):
    """
    Test that we can query the relevant data
    """
    # 1) Arrange
    # Mock the query return  
    mock_db.query.return_value.filter.return_value.all.return_value = [
        Profile(Username="TestUsername1",
                Email="username1@gmail.com",
                NumberOfRating=5,
                CurrentRating=4.0),
        Card(OwnerID=1,
            CardName="TestCard1",
            CardQuality="PSA10"),
        Auction(AuctionID=1,
                SellerID=1,
                Status="Active test")
    ]

    # 2) Act 
    search_result = search_service.search_all_tables("Test")    

    # 3) Assert
    # Check the Profile result
    assert len(search_result["Profile"][0]) == 4
    assert search_result["Profile"][0]["Username"] == "TestUsername1"
    assert search_result["Profile"][0]["Email"] == "username1@gmail.com"
    assert search_result["Profile"][0]["NumberOfRating"] == 5
    assert search_result["Profile"][0]["CurrentRating"] == 4.0
    
    # Check the Card result
    assert len(search_result["Card"][1]) == 3
    assert search_result["Card"][1]["OwnerID"] == 1
    assert search_result["Card"][1]["CardName"] == "TestCard1"
    assert search_result["Card"][1]["CardQuality"] == "PSA10"
    
    # Check the Auction result
    assert len(search_result["Auction"][2]) == 3
    assert search_result["Auction"][2]["AuctionID"] == 1
    assert search_result["Auction"][2]["SellerID"] == 1
    assert search_result["Auction"][2]["Status"] == "Active test"

    mock_db.query.assert_called()
    mock_db.query.return_value.filter.assert_called()
    mock_db.query.return_value.filter.return_value.all.assert_called()
    

def test_search_no_results(search_service, mock_db):
    """
    Test search with no matches
    """
    # 1) Arrange
    # Mock the query return  
    mock_db.query.return_value.filter.return_value.all.return_value = []

    # 2) Act 
    search_result = search_service.search_all_tables("justatest")

    # 3) Assert
    assert search_result == {"Profile": [], "Card": [], "Auction": []}
    mock_db.query.assert_called()
    mock_db.query.return_value.filter.assert_called()
    mock_db.query.return_value.filter.return_value.all.assert_called()


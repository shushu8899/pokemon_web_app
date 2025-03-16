import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock
from app.exceptions import ServiceException

from app.services.card_service import CardService
from app.models.profile import Profile, ProfileInfo
from app.models.card import Card, CardInfo
from app.models.auction import Auction, AuctionInfo
from app.models.notifications import Notification, NotificationInfo

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def card_service(mock_db):
    return CardService(db=mock_db)

def test_get_card_by_username(card_service, mock_db):
    """
    Test that we can get cards by username
    """
    # 1) Arrange
    # Mock the query return  
    mock_profile = Profile(
        UserID=1,
        Username="TestUsername1",
        Email="username1@gmail.com",
        NumberOfRating=10,
        CurrentRating=4.5,
        CognitoUserID="cognito123"
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_profile

    mock_db.query.return_value.filter.return_value.all.return_value = [
        Card(CardID=1, 
                OwnerID=1,
                CardName="TestCard1",
                CardQuality="This is a test card",
                IsValidated=True,
                ImageURL="image1.jpg"
        )
    ]

    # 2) Act
    cards = card_service.get_cards_by_username("TestUsername1")

    # 3) Assert
    profile_call = mock_db.query.return_value.filter.call_args_list[0][0][0]
    card_call = mock_db.query.return_value.filter.call_args_list[1][0][0]

    # Assert that Profile filtering was done correctly
    assert str(profile_call) == str(Profile.Username == "TestUsername1"), \
        f"Expected {Profile.Username == 'TestUsername1'}, got {profile_call}"

    # Assert that Card filtering was done correctly
    assert str(card_call) == str(Card.OwnerID == 1), \
        f"Expected {Card.OwnerID == 1}, got {card_call}"
    
    mock_db.query.return_value.filter.return_value.first.assert_called_once()
    mock_db.query.return_value.filter.return_value.all.assert_called_once()
    assert len(cards) == 1
    assert cards[0].CardName == "TestCard1"
    assert cards[0].OwnerID == 1
    mock_db.query.assert_called()


def test_add_card(card_service, mock_db):
    """
    Test that we can add a new card if the user exists
    """
    # 1) Arrange
    mock_profile = Profile(
        UserID=1,
        Username="TestUsername1",
        Email="username1@gmail.com",
        NumberOfRating=10,
        CurrentRating=4.5,
        CognitoUserID="cognito123"
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_profile

    new_card = CardInfo(
        CardID=1, 
        OwnerID=1,
        CardName="TestCard1",
        CardQuality="This is a test card",
        IsValidated=True,
        ImageURL="image1.jpg"
    )

    mock_db.add.return_value = new_card
    mock_db.commit.return_value = None
    mock_db.refresh.return_value = new_card
    
    # 2) Act
    result = card_service.add_card(mock_profile.Username, new_card)

    # 3) Assert
    profile_call = mock_db.query.return_value.filter.call_args_list[0][0][0]
    assert str(profile_call) == str(Profile.Username == "TestUsername1"), \
        f"Expected {Profile.Username == 'TestUsername1'}, got {profile_call}"

    
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result.CardID == new_card.CardID
    assert result.OwnerID == new_card.OwnerID
    assert result.CardName == new_card.CardName
    assert result.CardQuality == new_card.CardQuality
    assert result.IsValidated == new_card.IsValidated
    assert result.ImageURL == new_card.ImageURL
    mock_db.query.assert_called()

def test_add_card_no_user(card_service, mock_db):
    """
    Test that we cannot add a new card if the user does not exist
    """
    # 1) Arrange
    mock_db.query.return_value.filter.return_value.first.return_value = None

    new_card = CardInfo(
        CardID=1, 
        OwnerID=1,
        CardName="TestCard1",
        CardQuality="This is a test card",
        IsValidated=True,
        ImageURL="image1.jpg"
    )

    # 2) Act
    with pytest.raises(ServiceException) as exc:
        card_service.add_card("TestUsername1", new_card)

    # 3) Assert
    assert exc.value.status_code == 404
    assert "User not found" in exc.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()
    mock_db.refresh.assert_not_called()

def test_delete_card_success(card_service, mock_db):
    # Mocking profile and card retrieval
    profile_mock = Mock()
    profile_mock.UserID = 1

    card_mock = Mock()

    # Simulate database responses
    mock_db.query().filter().first.side_effect = [profile_mock, card_mock]

    # Call the function
    result = card_service.delete_card(1, "testuser")

    # Asserts
    assert result is True
    mock_db.delete.assert_called_once_with(card_mock)
    mock_db.commit.assert_called_once()

def test_delete_card_user_not_found(card_service, mock_db):
    # No profile found
    mock_db.query().filter().first.return_value = None

    # Call the function
    result = card_service.delete_card(1, "nonexistent_user")

    # Asserts
    assert result is False
    mock_db.delete.assert_not_called()
    mock_db.commit.assert_not_called()

def test_delete_card_not_owned_by_user(card_service, mock_db):
    profile_mock = Mock()
    profile_mock.UserID = 1

    # Simulating a card not owned by the user but exists in the database
    mock_db.query().filter().first.side_effect = [profile_mock, None, Mock()]

    # Call the function & check for the raised exception
    with pytest.raises(ServiceException) as exc_info:
        card_service.delete_card(2, "testuser")

    assert exc_info.value.status_code == 403
    assert str(exc_info.value) == "Forbidden to delete card"

    mock_db.delete.assert_not_called()
    mock_db.commit.assert_not_called()

def test_delete_card_not_found(card_service, mock_db):
    profile_mock = Mock()
    profile_mock.UserID = 1

    # Simulating card not found in the entire database
    mock_db.query().filter().first.side_effect = [profile_mock, None, None]

    # Call the function & check for the raised exception
    with pytest.raises(ServiceException) as exc_info:
        card_service.delete_card(3, "testuser")

    assert exc_info.value.status_code == 404
    assert str(exc_info.value) == "Card not found"

    mock_db.delete.assert_not_called()
    mock_db.commit.assert_not_called()
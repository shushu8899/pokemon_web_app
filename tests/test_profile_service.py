import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock
from app.exceptions import ServiceException

from app.services.profile_service import ProfileService
from app.models.profile import Profile, ProfileInfo
from app.models.card import Card, CardInfo
from app.models.auction import Auction, AuctionInfo
from app.models.notifications import Notification, NotificationInfo

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def profile_service(mock_db):
    return ProfileService(db=mock_db)

def test_get_profile(profile_service, mock_db):
    """
    Test that we can create and read profile data
    """
    # 1) Arrange
    # Mock the query return  
    mock_db.query.return_value.all.return_value = [
        Profile(UserID=1, 
                Username="TestUsername1",
                Email="username1@gmail.com",
                NumberOfRating=5,
                CurrentRating=4.0,
                CognitoUserID="blahblahblah"
        ),
        Profile(UserID=2, 
                Username="TestUsername2",
                Email="username2@gmail.com",
                NumberOfRating=10,
                CurrentRating=3.5,
                CognitoUserID="kekekek"
        )
    ]

    # 2) Act 
    profiles = profile_service.get_all_profile()

    # 3) Assert
    assert len(profiles) == 2
    assert profiles[0].UserID == 1
    assert profiles[0].Username == "TestUsername1"
    assert profiles[0].Email == "username1@gmail.com"
    assert profiles[0].NumberOfRating == 5
    assert profiles[0].CurrentRating == 4.0
    assert profiles[0].CognitoUserID == "blahblahblah"

    assert profiles[1].UserID == 2
    assert profiles[1].Username == "TestUsername2"
    assert profiles[1].Email == "username2@gmail.com"
    assert profiles[1].NumberOfRating == 10
    assert profiles[1].CurrentRating == 3.5
    assert profiles[1].CognitoUserID == "kekekek"

    mock_db.query.assert_called_once_with(Profile)
    mock_db.query.return_value.all.assert_called_once()

def test_get_profile_id_not_found(profile_service, mock_db):
    # 1) Arrange
    mock_db.query().filter().first.return_value = None

    # 2) Act 
    result = profile_service.get_profile_id("invalid_username")

    # 3) Assert
    assert result is None
    mock_db.query().filter().first.assert_called_once()

def test_get_profile_id_success(profile_service, mock_db):
    # 1) Arrange
    profile_mock = Mock(spec=Profile)
    profile_mock.UserID = 1

    # 2) Act 
    mock_db.query().filter().first.return_value = profile_mock
    result = profile_service.get_profile_id("valid_username")

    # 3) Assert
    assert result == 1
    mock_db.query().filter().first.assert_called_once()

def test_add_profile_email_already_exists(profile_service, mock_db):
    # Mock profile info
    profile_data = Mock(spec=ProfileInfo)
    profile_data.Username = "TestUsername1"
    profile_data.Email = "username1@gmail.com"

    # Simulate email already exists in the database
    mock_db.query().filter().first.side_effect = [None, Mock(spec=Profile)]

    # Call the function and assert ServiceException is raised
    with pytest.raises(ServiceException) as excinfo:
        profile_service.add_profile(profile_data)

    # Asserts
    assert excinfo.value.status_code == 409
    assert str(excinfo.value.detail) == "Email already exists"
    assert mock_db.query().filter().first.call_count == 2  # Check that two queries were made



def test_create_duplicate_username(profile_service, mock_db):
    """
    Test for creation of profile with duplicate Username
    Note : Username is the Email in this case
    """
    # 1) Arrange
    profile_data = ProfileInfo(UserID=1,
                               Username="TestUsername1",
                               Email="username1@gmail.com",
                               NumberofRating=5,
                               CurrentRating=4.0,
                               CognitoUserID="blahblahblah")
    
    existing_profile_user = Mock()

    existing_profile_user.UserID = 2
    existing_profile_user.Username = "TestUsername1"
    existing_profile_user.Email = "username2@gmail.com"
    existing_profile_user.NumberOfRating = 10
    existing_profile_user.CurrentRating = 3.5
    existing_profile_user.CognitoUserID = "kekekek"

    mock_db.query.return_value.filter.return_value.first.return_value = existing_profile_user

    # 2) Act
    with pytest.raises(ServiceException) as exc_info:
        profile_service.add_profile(profile_data)
    
    # 3) Assert
    assert exc_info.value.status_code == 409
    assert "Username already exists" in exc_info.value.detail
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()

def test_update_profile(profile_service, mock_db):
    """
    Check if the update of the profile is successful
    """
    # 1) Arrange 
    existing_profile = Mock()

    existing_profile.UserID = 1
    existing_profile.Username = "TestUsername1"
    existing_profile.Email = "username1@gmail.com"
    existing_profile.NumberOfRating = 10
    existing_profile.CurrentRating = 3.5
    existing_profile.CognitoUserID = "kekekek"

    # We can update the values here
    updated_data = ProfileInfo(UserID=1, 
                                Username="TestUsername1", 
                                Email="username2@gmail.com", 
                                NumberOfRating=10,
                                CurrentRating=3.5,
                                CognitoUserID="kekekek")

    # 2) Act
    mock_db.query.return_value.filter.return_value.first.side_effect = [existing_profile, None]
    
    result = profile_service.update_profile("TestUsername1", updated_data)

    # 3) Assert
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result == existing_profile

def test_delete_profile(profile_service, mock_db):
    """
    Test for deletion of profile
    """
    # 1) Arrange
    existing_profile = Mock()

    existing_profile.UserID = 1
    existing_profile.Username = "TestUsername1"
    existing_profile.Password = "TestPW1"
    existing_profile.Email = "username1@gmail.com"
    existing_profile.NumberOfRating = 10
    existing_profile.CurrentRating = 3.5
    existing_profile.CognitoUserID = "kekekek"

    mock_db.query.return_value.filter.return_value.first.return_value = existing_profile

    # 2) Act
    result = profile_service.delete_profile(username="TestUsername1")

    # 3) Assert
    mock_db.delete.assert_called_once_with(existing_profile)
    mock_db.commit.assert_called_once()
    assert result is True

def test_delete_profile_not_found(profile_service, mock_db):
    """
    Test for deletion of profile that does not exist
    """
    # 1) Arrange
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # 2) Act
    result = profile_service.delete_profile(username="TestUsername1")

    # 3) Assert
    mock_db.delete.assert_not_called()
    mock_db.commit.assert_not_called()
    assert result is False
    
    mock_db.add.assert_not_called()
    mock_db.commit.assert_not_called()
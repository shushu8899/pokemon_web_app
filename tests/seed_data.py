"""
This python scripts seed some generic data into a DB for integration testing 
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.db import SessionLocal
from app.models.profile import Profile
from app.models.card import Card
from app.models.auction import Auction

from datetime import datetime, timedelta, timezone


def seed_profiles():
    db = SessionLocal()

    # Check if profiles already exist to avoid duplicates
    if db.query(Profile).first():
        print("Profiles already exist. Skipping seed.")
        return

    # Sample profiles to add
    profiles = [
        Profile(
            Username="TestUsername1",
            Email="testusername1@gmail.com",
            NumberOfRating=10,
            CurrentRating=4.5,
            CognitoUserID="cognito_user_1"
        ),
        Profile(
            Username="TestUsername2",
            Email="testusername2@gmail.com",
            NumberOfRating=5,
            CurrentRating=4.0,
            CognitoUserID="cognito_user_2"
        ),
        Profile(
            Username="TestUsername3",
            Email="testusername3@gmail.com",
            NumberOfRating=20,
            CurrentRating=4.8,
            CognitoUserID="cognito_user_3"
        )
    ]

    # Add profiles to the session
    db.add_all(profiles)
    db.commit()
    db.close()
    pass

def seed_cards():
    db = SessionLocal()

    # Check if cards already exist to avoid duplicates
    if db.query(Card).first():
        print("Cards already exist. Skipping seed.")
        return

    # Sample cards to add
    cards = [
        Card(
            OwnerID=1,
            CardQuality="Brand New",
            CardName="Blaine's_Charizard",
            IsValidated=True,
            ImageURL="Test_URL1"
        ),
        Card(
            OwnerID=1,
            CardQuality="Dilapidated",
            CardName="Swablu",
            IsValidated=True,
            ImageURL="Test_URL2"
        ),
        Card(
            OwnerID=2,
            CardQuality="Brand New",
            CardName="Squirtle",
            IsValidated=False,
            ImageURL="Test_URL3"
        ),
        Card(
            OwnerID=3,
            CardQuality="Used",
            CardName="Golem",
            IsValidated=True,
            ImageURL="Test_URL4"
        )
    ]

    # Add cards to the session
    db.add_all(cards)
    db.commit()
    db.close()
    pass

def seed_auctions():
    """
    Make a dummy auction
    """
    db = SessionLocal()

    if db.query(Auction).first():
        print("Auctions already exist. Skipping seed.")
        return
    
    auction = Auction(
        CardID=1,
        SellerID=1,
        MinimumIncrement=1.0,
        Status="In Progress",
        EndTime=datetime.now(timezone.utc) + timedelta(days=7),
        HighestBidderID=None,
        HighestBid=10.0
    )

    db.add(auction)
    db.commit()
    db.close()
    pass

if __name__ == "__main__":
    seed_profiles()
    seed_cards()
    seed_auctions()
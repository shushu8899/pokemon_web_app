from app.dependencies.services import get_auction_service, get_profile_service
from app.models.auction import Auction, AuctionInfo, AuctionBid
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from apscheduler.schedulers.background import BackgroundScheduler


# Schedule the status update function every minute

def schedule_update_job():
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_job, 'interval', minutes=1)
    scheduler.start()

def update_job():
    auction_service = get_auction_service(db=get_db())
    auction_service.update_auction_status()



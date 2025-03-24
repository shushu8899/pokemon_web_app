import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from app.dependencies.services import get_auction_service
from app.dependencies.db import get_db

def schedule_update_job():
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_async_update, 'interval', seconds=10)
    scheduler.start()

def run_async_update():
    asyncio.run(update_job())

async def update_job():
    db = next(get_db())
    auction_service = get_auction_service(db=db)
    await auction_service.update_auction_status()

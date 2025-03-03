from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, Query, BackgroundTasks, status, Body
from fastapi.responses import HTMLResponse, JSONResponse
from app.services.auction_service import AuctionService
from app.services.profile_service import ProfileService, get_current_user
from sqlalchemy.orm import Session
from app.models.auction import Auction, AuctionInfo, AuctionBid, AuctionResponse
from app.models.card import Card
from app.dependencies.services import get_auction_service, get_profile_service
from pydantic import BaseModel
from app.models.auction import AuctionInfo
from app.models.notifications import Notification
from typing import Dict
from sqlalchemy.orm import Session
from app.dependencies.auth import req_user_role #Add this
from app.services.utils import schedule_update_job
from jose import jwt
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import os

from app.db.db import get_db
from app.routes.auth import cognito_service
from app.dependencies.auth import req_user_role, req_admin_role

router = APIRouter()
schedule_update_job()

@router.get("/auction-collection")
async def display_auction_page(page: int = Query(1, description="Page number"),  auction_service: AuctionService = Depends(get_auction_service)):
    auctions = auction_service.get_auctions_by_page(page)
    total_pages =  auction_service.get_total_page()
    print(auctions)
    print(total_pages)
    for auction in auctions:
        auction["EndTime"] = auction["EndTime"].timestamp()
    return {"auctions": auctions, "total_pages": int(total_pages)}

@router.get("/auction-details/{auction_id}", response_model=dict)
def display_auction_details(
    auction_id: int,
    auction_service: AuctionService = Depends(get_auction_service),
    db: Session = Depends(get_db)
):
    try:
        auction_details = auction_service.get_auctions_details(auction_id)
        
        if not auction_details:
            raise HTTPException(status_code=404, detail="Auction not found")
        
        auction_details["EndTime"] = auction_details["EndTime"].timestamp()
        
    except HTTPException as e: 
        raise e
    except Exception as e: 
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/place-bid/{auction_id}",response_model=AuctionResponse,dependencies=[Depends(req_user_role)])
async def place_bid(auction_id: int,
    bid_amount: float = Body(...),
    auction_service: AuctionService = Depends(get_auction_service),
    profile_service: ProfileService = Depends(get_profile_service),
    auth_info: dict = Depends(get_current_user)
):  # ✅ Require authentication
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")
    bid_info = AuctionBid(AuctionID=auction_id, BidAmount=bid_amount)
    try:
        auction = auction_service.bid_auction(cognito_id, bid_info, profile_service)
        if not auction:
            raise HTTPException(status_code=400, detail="Failed to place bid")
        return auction
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notifications/{auction_id}")
async def get_notifications(auction_id: int, db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(Notification.AuctionID == auction_id).all()
    result = [{"auction_id": n.AuctionID, "message": n.Message, "timestamp": n.TimeSent.isoformat()} for n in notifications]
    return JSONResponse(content=result)

@router.post("/cleanup_auctions", dependencies=[Depends(req_admin_role)])
def cleanup_auctions(background_tasks: BackgroundTasks, db: Session = Depends(get_db), auth_info: dict = Depends(get_current_user)):
    AuctionService.schedule_auction_cleanup(background_tasks, db)
    return {"message": "Auction cleanup scheduled."}
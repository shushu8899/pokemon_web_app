from fastapi import APIRouter, Depends, HTTPException
from app.services.profile_service import get_current_user
from app.models.notifications import Notification
from typing import Dict
from sqlalchemy.orm import Session
from app.models.profile import Profile
from app.dependencies.auth import req_user_or_admin
from app.db.db import get_db
from app.routes.auth import cognito_service

router = APIRouter()


@router.get("/my-notifications", dependencies=[Depends(req_user_or_admin)])
async def get_my_notifications(
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    """
    Get all notifications based the currently logged-in user.
    
    """
    cognito_user_id = auth_info.get("sub")

    # Retrieve the user_id from the profiles table based on the cognito_user_id
    user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    owner_id = user_profile.UserID

    all_notifications = db.query(Notification).filter(Notification.ReceiverID == owner_id)

    # Format the response
    return {
        "Notifications": [
            {
                "notification_id": notification.NotificationID,
                "auction_id": notification.AuctionID,
                "message": notification.Message,
                "sent_date": notification.TimeSent.isoformat(),
                "is_read": notification.IsRead,
            }
            for notification in all_notifications
        ],
        "Total": all_notifications.count(),
    }

@router.put("/mark-read", dependencies=[Depends(req_user_or_admin)])
async def mark_all_as_read(
    db: Session = Depends(get_db),
    auth_info: dict = Depends(get_current_user)
):
    user_id = db.query(Profile).filter(Profile.CognitoUserID == auth_info["sub"]).first().UserID
    db.query(Notification).filter(Notification.ReceiverID == user_id, Notification.IsRead == False).update({Notification.IsRead: True})
    db.commit()
    return {"detail": "All notifications marked as read"}
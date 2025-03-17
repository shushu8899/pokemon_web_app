from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.websocket_manager import WebSocketManager
from sqlalchemy.orm import Session
from app.dependencies.services import get_auction_service, get_profile_service, get_websocket_manager
from app.services.auction_service import AuctionService
from app.services.profile_service import ProfileService, get_current_user

router = APIRouter()

# WebSocket connection endpoint
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, 
                             profile_service: ProfileService = Depends(get_profile_service),
                             auth_info: dict = Depends(get_current_user),
                             websocket_manager: WebSocketManager = Depends(get_websocket_manager)):
    
    cognito_id = auth_info.get("sub")
    user_id = profile_service.get_profile_id(cognito_id)

    await websocket_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Message from {user_id}: {data}")
    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id)

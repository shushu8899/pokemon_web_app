from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.db.db import get_db  # Import the db session dependency
from app.services.websocket_manager import WebSocketManager
from sqlalchemy.orm import Session

router = APIRouter()

# Dependency to get WebSocketManager with db session
def get_websocket_manager(db: Session = Depends(get_db)) -> WebSocketManager:
    return WebSocketManager(db=db)

# WebSocket connection endpoint
@router.websocket("/ws/{email}")
async def websocket_endpoint(websocket: WebSocket, email: str, websocket_manager: WebSocketManager = Depends(get_websocket_manager)):
    await websocket_manager.connect(websocket, email)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Message from {email}: {data}")
    except WebSocketDisconnect:
        websocket_manager.disconnect(email)

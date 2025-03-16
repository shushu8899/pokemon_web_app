from typing import List, Dict
from fastapi import WebSocket
from app.models.profile import Profile
from sqlalchemy.orm import Session

class WebSocketManager:
    def __init__(self, db: Session):
        self.db = db
        self.active_connections: Dict[str, WebSocket] = {}  # Map email -> WebSocket

    async def connect(self, websocket: WebSocket, email: str):
        await websocket.accept()
        self.active_connections[email] = websocket  # Store the WebSocket by email

    def disconnect(self, email: str):
        if email in self.active_connections:
            del self.active_connections[email]  # Remove the WebSocket by email

    async def send_personal_message(self, message: str, email: str):
        websocket = self.active_connections.get(email)
        if websocket:
            await websocket.send_text(message)  # Send message to the user's WebSocket connection

    async def send_notification(self, email: str, message: str):
        websocket = self.active_connections.get(email)
        if websocket:
            await websocket.send_text(message)  # Send notification to the user's WebSocket connection

    def get_user_id_by_email(self, email: str) -> int:
        profile = self.db.query(Profile).filter(Profile.Email == email).first()
        if profile:
            return profile.UserID
        return None

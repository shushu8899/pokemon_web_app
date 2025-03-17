from typing import List, Dict
from fastapi import WebSocket
from app.models.profile import Profile
from sqlalchemy.orm import Session

class WebSocketManager:
    def __init__(self):
        self.active_connections = {}  # Dictionary to store active connections

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()  # Accepts the WebSocket connection
        self.active_connections[user_id] = websocket  # Stores it

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]  # Removes disconnected user

    async def send_message(self, user_id: str, message: str):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_text(message)  # Sends a message

# app/services/socket_manager.py
from fastapi import WebSocket, WebSocketDisconnect
import json
from datetime import datetime, timezone
from app.models.notifications import Notification

class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, email: str):
        await websocket.accept()
        self.active_connections[email] = websocket
        print(f"✅ Backend WebSocket connection established for {email}")
        print(self.active_connections)

    async def disconnect(self, websocket: WebSocket):
        email_to_remove = None
        for email, conn in self.active_connections.items():
            if conn == websocket:
                email_to_remove = email
                break

        if email_to_remove:
            del self.active_connections[email_to_remove]
            print(f"🔌 Disconnected WebSocket for {email_to_remove}")

        try:
            await websocket.close()
        except Exception as e:
            print(f"⚠️ Error closing WebSocket: {e}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"⚠️ Failed to send message: {e}")

    async def send_notification(self, email: str, message: dict):
        websocket = self.active_connections.get(email)
        if websocket:
            try:
                await websocket.send_text(json.dumps(message))  # ✅ one json.dumps
                print(f"📩 Notification sent to {email}: {message}")
            except Exception as e:
                print(f"⚠️ Error sending notification to {email}: {e}")
        else:
            print(f"⚠️ No active connection for {email}")

websocket_manager = WebSocketManager()
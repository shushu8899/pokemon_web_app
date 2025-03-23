from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.websocket_manager import websocket_manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, email: str = Query(...)):
    print(f"🔗 WebSocket connection attempt from {email}")

    try:
        # Accept & store connection
        await websocket_manager.connect(websocket, email)
        print(f"✅ Connected WebSocket for {email}")

        while True:
            try:
                data = await websocket.receive_text()
                print(f"📩 Message from {email}: {data}")

                # Echo message back
                await websocket_manager.send_personal_message(f"You said: {data}", websocket)

            except Exception as e:
                print(f"⚠️ Unexpected error while receiving message from {email}: {e}")
                break  # Exit the loop if receiving fails

    except Exception as e:
        print(f"❌ WebSocket error for {email}: {e}")

    finally:
        await websocket_manager.disconnect(websocket)
        print(f"🔌 WebSocket closed for {email}")

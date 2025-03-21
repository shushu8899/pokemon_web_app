from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from app.services.websocket_manager import WebSocketManager
from app.services.cognito_service import CognitoService
from app.exceptions import ServiceException

router = APIRouter()
socket_manager = WebSocketManager()

# # Authentication Dependency
# def authenticate_token(token: str, cognito_service: CognitoService = Depends(CognitoService)):
#     print(f"🔍 Validating token: {token[:20]}...")  # Print first 20 chars to avoid exposing full token
#     try:
#         claims = cognito_service.validate_token(token)
#         print(f"✅ Token valid. User email: {claims.get('email', 'Unknown')}")
#         return claims
#     except ServiceException as e:
#         print(f"❌ Token validation failed: {e}")
#         raise HTTPException(status_code=e.status_code, detail=e.detail)

# # Correct WebSocket Endpoint
# @router.websocket("/ws")
# async def websocket_endpoint(
#     websocket: WebSocket,
#     token: str = Query(...),
#     cognito_service: CognitoService = Depends(CognitoService)
# ):
#     print("Received token:", token)
#     try:
#         # Authenticate using query parameter token
#         claims = authenticate_token(token, cognito_service)
#         user_email = claims['email']

#         # Accept and store connection
#         await socket_manager.connect(websocket, user_email)
#         print(f"WebSocket connected: {user_email}")

#         try:
#             while True:
#                 data = await websocket.receive_text()
#                 print(f"Message from {user_email}: {data}")
#                 await socket_manager.send_personal_message(f"You said: {data}", websocket)
#         except WebSocketDisconnect:
#             await socket_manager.disconnect(websocket)
#             print(f"Client {user_email} disconnected")
#     except HTTPException:
#         await websocket.close(code=1008)
#         print("WebSocket closed: Invalid Token")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("🔗 New WebSocket connection attempt...")
    
    # Accept WebSocket connection
    await websocket.accept()
    print("✅ WebSocket connected")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"📩 Received message: {data}")
            await socket_manager.send_personal_message(f"You said: {data}", websocket)
    except WebSocketDisconnect:
        await socket_manager.disconnect(websocket)
        print("❌ WebSocket disconnected")
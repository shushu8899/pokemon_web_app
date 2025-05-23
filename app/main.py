#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
import logging

from app.routes import chroma, search, seller_submission, card_verification, auth, auction_page, pokemon_rag, profile_rating, card_entry, profile, notifications, websocket
from app.exceptions import ServiceException
from app.db.db import engine, Base

# Import the HTTPBearer class
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Update the FastAPI application
app = FastAPI(
    title="Pokémon Card Auction Platform API",
    description="This API provides endpoints for the Pokémon Card Auction Platform.",
    version="1.0.0"
)

# Mount static files directory
# app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"]
)

# Global exception handler for HTTP exceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP exception occurred: {str(exc)}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# Global exception handler for custom exceptions - service layer (i.e., business logic layer) exceptions
@app.exception_handler(ServiceException)
async def service_exception_handler(request: Request, exc: ServiceException):
    logger.warning(f"Service exception occurred: {str(exc)}")
    return JSONResponse(
        status_code=exc.status_code,  # status code from the exception
        content={"detail": exc.detail},  # message from the exception
    )

# Global exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception occurred: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"}
    )

# Register routes
app.include_router(auth.router, prefix="", tags=["Authentication"])
app.include_router(card_entry.router, prefix="/entry", tags=["Card Entry"])
app.include_router(card_verification.router, prefix="/verification", tags=["Verification"])
app.include_router(seller_submission.router, prefix="/auction", tags=["Submission"])
app.include_router(auction_page.router, prefix="/bidding", tags=["Auction Page"])
app.include_router(profile_rating.router, prefix="/profile", tags=["Rate the Seller"])
app.include_router(search.router, prefix="", tags=["Search"])
app.include_router(chroma.router, prefix="/rag", tags=["RAG"])
app.include_router(pokemon_rag.router, prefix="/rag", tags=["RAG"])
app.include_router(profile.router, tags=["Profile"])
app.include_router(notifications.router, prefix="/noti", tags=["Notifications"])
app.include_router(websocket.router)

# Create database tables
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Pokémon Card Auction Platform"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, ws="websockets")

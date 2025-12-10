from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# Import routers
from routers import auth_router, user_router, game_router, bet_router, transaction_router, admin_router
from database import setup_indexes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create FastAPI app
app = FastAPI(title="SnookerBet P2P API", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth_router.router, prefix="/api")
app.include_router(user_router.router, prefix="/api")
app.include_router(game_router.router, prefix="/api")
app.include_router(bet_router.router, prefix="/api")
app.include_router(transaction_router.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")

# Root endpoint
@app.get("/api/")
async def root():
    return {"message": "SnookerBet P2P API", "version": "1.0.0"}

# Health check
@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# Startup event
@app.on_event("startup")
async def startup_event():
    await setup_indexes()
    logging.info("Database indexes created")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
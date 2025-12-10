from fastapi import APIRouter, Depends, HTTPException, Request
from models import GameCreate, GameResponse, GameUpdate, GameStatus
from auth import get_current_user, require_admin
from database import db
from typing import List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/games", tags=["games"])

async def log_activity(user_email: str, action: str, details: dict, ip_address: str = None):
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "action": action,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@router.post("/", response_model=GameResponse)
async def create_game(
    game_data: GameCreate,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    game_doc = {
        "id": str(uuid.uuid4()),
        "player_a": game_data.player_a,
        "player_b": game_data.player_b,
        "match_date": game_data.match_date.isoformat(),
        "status": GameStatus.UPCOMING,
        "description": game_data.description,
        "total_bets_a": 0.0,
        "total_bets_b": 0.0,
        "winner": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["email"]
    }
    
    await db.games.insert_one(game_doc)
    
    await log_activity(
        current_user["email"],
        "game_created",
        {"game_id": game_doc["id"], "players": f"{game_data.player_a} vs {game_data.player_b}"},
        request.client.host if request.client else None
    )
    
    return {**game_doc, "_id": None}

@router.get("/", response_model=List[GameResponse])
async def get_games(status: str = None, limit: int = 50):
    query = {}
    if status:
        query["status"] = status
    
    games = await db.games.find(query, {"_id": 0}).sort("match_date", -1).limit(limit).to_list(limit)
    return games

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: str):
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return game

@router.patch("/{game_id}", response_model=GameResponse)
async def update_game(
    game_id: str,
    update_data: GameUpdate,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.games.update_one({"id": game_id}, {"$set": update_dict})
        
        # If game is finished and winner is set, distribute prizes
        if update_data.winner and update_data.status == GameStatus.FINISHED:
            await distribute_prizes(game_id, update_data.winner)
        
        await log_activity(
            current_user["email"],
            "game_updated",
            {"game_id": game_id, "updates": update_dict},
            request.client.host if request.client else None
        )
    
    updated_game = await db.games.find_one({"id": game_id}, {"_id": 0})
    return updated_game

async def distribute_prizes(game_id: str, winner: str):
    """Distribute prizes to winners after game finishes"""
    # Get all matched bets for this game
    winning_bets = await db.bets.find({
        "game_id": game_id,
        "player_choice": winner,
        "status": "matched"
    }).to_list(1000)
    
    for bet in winning_bets:
        # Calculate winnings (matched_amount * 2 - original amount = profit + return)
        winnings = bet["matched_amount"] * 2
        
        # Update user balance
        await db.users.update_one(
            {"email": bet["user_email"]},
            {"$inc": {"balance": winnings}}
        )
        
        # Update bet status
        await db.bets.update_one(
            {"id": bet["id"]},
            {"$set": {"status": "won"}}
        )
        
        # Create transaction record
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_email": bet["user_email"],
            "type": "bet_won",
            "amount": winnings,
            "status": "completed",
            "related_bet_id": bet["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Log activity
        await log_activity(
            bet["user_email"],
            "bet_won",
            {"game_id": game_id, "amount": winnings},
            None
        )
    
    # Mark losing bets
    await db.bets.update_many(
        {
            "game_id": game_id,
            "player_choice": {"$ne": winner},
            "status": "matched"
        },
        {"$set": {"status": "lost"}}
    )
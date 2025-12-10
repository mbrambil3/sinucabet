from fastapi import APIRouter, Depends, HTTPException, Request
from models import BetCreate, BetResponse, BetStatus, GameStatus
from auth import get_current_user
from database import db
from typing import List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/bets", tags=["bets"])

async def log_activity(user_email: str, action: str, details: dict, ip_address: str = None):
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "action": action,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@router.post("/", response_model=BetResponse)
async def place_bet(
    bet_data: BetCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    # Validate game exists and is live
    game = await db.games.find_one({"id": bet_data.game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    
    if game["status"] not in [GameStatus.UPCOMING, GameStatus.LIVE]:
        raise HTTPException(status_code=400, detail="Jogo não está aceitando apostas")
    
    # Validate player choice
    if bet_data.player_choice not in [game["player_a"], game["player_b"]]:
        raise HTTPException(status_code=400, detail="Jogador inválido")
    
    # Check user balance
    user = await db.users.find_one({"email": current_user["email"]})
    if user["balance"] < bet_data.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    # Deduct bet amount from balance
    await db.users.update_one(
        {"email": current_user["email"]},
        {
            "$inc": {
                "balance": -bet_data.amount,
                "total_bet": bet_data.amount
            }
        }
    )
    
    # Create bet
    bet_doc = {
        "id": str(uuid.uuid4()),
        "game_id": bet_data.game_id,
        "user_email": current_user["email"],
        "player_choice": bet_data.player_choice,
        "amount": bet_data.amount,
        "matched_amount": 0.0,
        "status": BetStatus.PENDING,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bets.insert_one(bet_doc)
    
    # Create transaction record
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_email": current_user["email"],
        "type": "bet_placed",
        "amount": -bet_data.amount,
        "status": "completed",
        "related_bet_id": bet_doc["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Try to match bets
    await match_bets(bet_doc["id"], bet_data.game_id, bet_data.player_choice)
    
    # Update game totals
    field = "total_bets_a" if bet_data.player_choice == game["player_a"] else "total_bets_b"
    await db.games.update_one(
        {"id": bet_data.game_id},
        {"$inc": {field: bet_data.amount}}
    )
    
    # Log activity
    await log_activity(
        current_user["email"],
        "bet_placed",
        {
            "game_id": bet_data.game_id,
            "player": bet_data.player_choice,
            "amount": bet_data.amount
        },
        request.client.host if request.client else None
    )
    
    # Return updated bet
    updated_bet = await db.bets.find_one({"id": bet_doc["id"]}, {"_id": 0})
    return updated_bet

async def match_bets(bet_id: str, game_id: str, player_choice: str):
    """Match bets between opposing players"""
    # Get the current bet
    current_bet = await db.bets.find_one({"id": bet_id})
    if not current_bet:
        return
    
    # Get game to find opposite player
    game = await db.games.find_one({"id": game_id})
    opposite_player = game["player_b"] if player_choice == game["player_a"] else game["player_a"]
    
    # Find pending bets for opposite player
    opposite_bets = await db.bets.find({
        "game_id": game_id,
        "player_choice": opposite_player,
        "status": "pending"
    }).sort("created_at", 1).to_list(100)
    
    remaining_amount = current_bet["amount"] - current_bet["matched_amount"]
    
    for opp_bet in opposite_bets:
        if remaining_amount <= 0:
            break
        
        opp_remaining = opp_bet["amount"] - opp_bet["matched_amount"]
        match_amount = min(remaining_amount, opp_remaining)
        
        # Update current bet
        await db.bets.update_one(
            {"id": bet_id},
            {
                "$inc": {"matched_amount": match_amount},
                "$set": {"status": "matched"}
            }
        )
        
        # Update opposite bet
        new_opp_matched = opp_bet["matched_amount"] + match_amount
        new_opp_status = "matched" if new_opp_matched == opp_bet["amount"] else "pending"
        
        await db.bets.update_one(
            {"id": opp_bet["id"]},
            {
                "$inc": {"matched_amount": match_amount},
                "$set": {"status": new_opp_status}
            }
        )
        
        remaining_amount -= match_amount

@router.get("/", response_model=List[BetResponse])
async def get_user_bets(
    current_user: dict = Depends(get_current_user),
    game_id: str = None,
    limit: int = 50
):
    query = {"user_email": current_user["email"]}
    if game_id:
        query["game_id"] = game_id
    
    bets = await db.bets.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return bets

@router.get("/game/{game_id}")
async def get_game_bets(game_id: str):
    """Get all bets for a specific game (for displaying bet matching status)"""
    bets = await db.bets.find({"game_id": game_id}, {"_id": 0, "user_email": 0}).to_list(1000)
    
    # Aggregate by player
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    
    player_a_total = sum(b["amount"] for b in bets if b["player_choice"] == game["player_a"])
    player_b_total = sum(b["amount"] for b in bets if b["player_choice"] == game["player_b"])
    player_a_matched = sum(b["matched_amount"] for b in bets if b["player_choice"] == game["player_a"])
    player_b_matched = sum(b["matched_amount"] for b in bets if b["player_choice"] == game["player_b"])
    
    return {
        "game_id": game_id,
        "player_a": game["player_a"],
        "player_b": game["player_b"],
        "player_a_bets": {
            "total": player_a_total,
            "matched": player_a_matched,
            "pending": player_a_total - player_a_matched
        },
        "player_b_bets": {
            "total": player_b_total,
            "matched": player_b_matched,
            "pending": player_b_total - player_b_matched
        },
        "total_matched": min(player_a_matched, player_b_matched)
    }
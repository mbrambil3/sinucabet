from fastapi import APIRouter, Depends
from auth import require_admin
from database import db
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
async def get_platform_stats(current_user: dict = Depends(require_admin)):
    """Get platform statistics"""
    
    # Count users
    total_users = await db.users.count_documents({})
    
    # Count games
    total_games = await db.games.count_documents({})
    live_games = await db.games.count_documents({"status": "live"})
    
    # Count bets
    total_bets = await db.bets.count_documents({})
    
    # Sum of all bets
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    bet_total_result = await db.bets.aggregate(pipeline).to_list(1)
    total_bet_amount = bet_total_result[0]["total"] if bet_total_result else 0
    
    # Pending transactions
    pending_deposits = await db.transactions.count_documents({"type": "deposit", "status": "pending"})
    pending_withdrawals = await db.transactions.count_documents({"type": "withdrawal", "status": "pending"})
    
    # Platform balance (sum of all user balances)
    users_pipeline = [
        {"$group": {"_id": None, "total_balance": {"$sum": "$balance"}}}
    ]
    balance_result = await db.users.aggregate(users_pipeline).to_list(1)
    platform_balance = balance_result[0]["total_balance"] if balance_result else 0
    
    return {
        "total_users": total_users,
        "total_games": total_games,
        "live_games": live_games,
        "total_bets": total_bets,
        "total_bet_amount": total_bet_amount,
        "pending_deposits": pending_deposits,
        "pending_withdrawals": pending_withdrawals,
        "platform_balance": platform_balance
    }

@router.get("/users")
async def get_all_users(current_user: dict = Depends(require_admin), limit: int = 100):
    """Get all users"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return users

@router.get("/activity-logs")
async def get_all_activity_logs(
    current_user: dict = Depends(require_admin),
    user_email: str = None,
    action: str = None,
    limit: int = 200
):
    """Get activity logs for all users or specific user"""
    query = {}
    if user_email:
        query["user_email"] = user_email
    if action:
        query["action"] = action
    
    logs = await db.activity_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs
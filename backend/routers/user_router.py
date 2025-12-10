from fastapi import APIRouter, Depends, HTTPException
from models import UserProfile, TransactionResponse
from auth import get_current_user
from database import db
from typing import List

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user["email"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.get("/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {
        "balance": user.get("balance", 0.0),
        "total_deposited": user.get("total_deposited", 0.0),
        "total_withdrawn": user.get("total_withdrawn", 0.0),
        "total_bet": user.get("total_bet", 0.0)
    }

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(current_user: dict = Depends(get_current_user), limit: int = 50):
    transactions = await db.transactions.find(
        {"user_email": current_user["email"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return transactions

@router.get("/activity-logs")
async def get_activity_logs(current_user: dict = Depends(get_current_user), limit: int = 100):
    logs = await db.activity_logs.find(
        {"user_email": current_user["email"]},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs
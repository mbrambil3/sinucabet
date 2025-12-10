from fastapi import APIRouter, Depends, HTTPException, Request
from models import TransactionCreate, TransactionResponse, TransactionType, TransactionStatus
from auth import get_current_user, require_admin
from database import db
from typing import List
from datetime import datetime, timezone
import uuid
import random
import string

router = APIRouter(prefix="/transactions", tags=["transactions"])

async def log_activity(user_email: str, action: str, details: dict, ip_address: str = None):
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "action": action,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

def generate_pix_code():
    """Generate a mock PIX code for demonstration"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=44))

@router.post("/deposit", response_model=TransactionResponse)
async def create_deposit(
    transaction: TransactionCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a deposit request (PIX code generation)"""
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Valor inválido")
    
    if transaction.amount > 3000:
        raise HTTPException(status_code=400, detail="Valor máximo por transação: R$ 3000")
    
    # Generate PIX code (mock - in production, call PagSeguro API)
    pix_code = generate_pix_code()
    
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "user_email": current_user["email"],
        "type": TransactionType.DEPOSIT,
        "amount": transaction.amount,
        "status": TransactionStatus.PENDING,
        "pix_code": pix_code,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    await log_activity(
        current_user["email"],
        "deposit_requested",
        {"amount": transaction.amount, "transaction_id": transaction_doc["id"]},
        request.client.host if request.client else None
    )
    
    return {**transaction_doc, "_id": None}

@router.post("/withdrawal", response_model=TransactionResponse)
async def create_withdrawal(
    transaction: TransactionCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a withdrawal request"""
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Valor inválido")
    
    if not transaction.pix_key:
        raise HTTPException(status_code=400, detail="Chave PIX obrigatória")
    
    # Check balance
    user = await db.users.find_one({"email": current_user["email"]})
    if user["balance"] < transaction.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    
    # Deduct from balance
    await db.users.update_one(
        {"email": current_user["email"]},
        {
            "$inc": {
                "balance": -transaction.amount,
                "total_withdrawn": transaction.amount
            }
        }
    )
    
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "user_email": current_user["email"],
        "type": TransactionType.WITHDRAWAL,
        "amount": transaction.amount,
        "status": TransactionStatus.PENDING,
        "pix_key": transaction.pix_key,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    await log_activity(
        current_user["email"],
        "withdrawal_requested",
        {"amount": transaction.amount, "pix_key": transaction.pix_key},
        request.client.host if request.client else None
    )
    
    return {**transaction_doc, "_id": None}

@router.post("/deposit/{transaction_id}/confirm")
async def confirm_deposit(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin confirms a deposit (simulates PIX payment confirmation)"""
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    if transaction["type"] != TransactionType.DEPOSIT:
        raise HTTPException(status_code=400, detail="Tipo de transação inválido")
    
    if transaction["status"] != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Transação já processada")
    
    # Update transaction status
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": {"status": TransactionStatus.COMPLETED}}
    )
    
    # Add to user balance
    await db.users.update_one(
        {"email": transaction["user_email"]},
        {
            "$inc": {
                "balance": transaction["amount"],
                "total_deposited": transaction["amount"]
            }
        }
    )
    
    await log_activity(
        transaction["user_email"],
        "deposit_confirmed",
        {"amount": transaction["amount"], "transaction_id": transaction_id},
        None
    )
    
    return {"message": "Depósito confirmado com sucesso"}

@router.post("/withdrawal/{transaction_id}/complete")
async def complete_withdrawal(
    transaction_id: str,
    current_user: dict = Depends(require_admin)
):
    """Admin completes a withdrawal (simulates PIX payout)"""
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    if transaction["type"] != TransactionType.WITHDRAWAL:
        raise HTTPException(status_code=400, detail="Tipo de transação inválido")
    
    if transaction["status"] != TransactionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Transação já processada")
    
    # Update transaction status
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": {"status": TransactionStatus.COMPLETED}}
    )
    
    await log_activity(
        transaction["user_email"],
        "withdrawal_completed",
        {"amount": transaction["amount"], "transaction_id": transaction_id},
        None
    )
    
    return {"message": "Saque processado com sucesso"}

@router.get("/pending", response_model=List[TransactionResponse])
async def get_pending_transactions(
    current_user: dict = Depends(require_admin),
    transaction_type: str = None
):
    """Admin gets all pending transactions"""
    query = {"status": TransactionStatus.PENDING}
    if transaction_type:
        query["type"] = transaction_type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return transactions

@router.get("/all", response_model=List[TransactionResponse])
async def get_all_transactions(
    current_user: dict = Depends(require_admin),
    limit: int = 100
):
    """Admin gets all transactions"""
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return transactions
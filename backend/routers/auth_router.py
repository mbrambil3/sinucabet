from fastapi import APIRouter, HTTPException, status, Request
from models import UserRegister, UserLogin, TokenResponse, UserRole
from auth import get_password_hash, verify_password, create_access_token
from database import db
from config import get_settings
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

async def log_activity(user_email: str, action: str, details: dict, ip_address: str = None):
    """Helper function to log user activities"""
    await db.activity_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "action": action,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister, request: Request):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )
    
    # Check CPF if provided
    if user_data.cpf:
        existing_cpf = await db.users.find_one({"cpf": user_data.cpf})
        if existing_cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF já registrado"
            )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hashed_password,
        "cpf": user_data.cpf,
        "role": UserRole.USER,
        "balance": 0.0,
        "total_deposited": 0.0,
        "total_withdrawn": 0.0,
        "total_bet": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Log activity
    await log_activity(
        user_data.email,
        "user_registered",
        {"name": user_data.name},
        request.client.host if request.client else None
    )
    
    # Create token
    settings = get_settings()
    token = create_access_token(
        {"sub": user_data.email, "role": UserRole.USER},
        settings
    )
    
    return TokenResponse(
        access_token=token,
        user={
            "name": user_data.name,
            "email": user_data.email,
            "role": UserRole.USER,
            "balance": 0.0
        }
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Log activity
    await log_activity(
        credentials.email,
        "user_login",
        {},
        request.client.host if request.client else None
    )
    
    # Create token
    settings = get_settings()
    token = create_access_token(
        {"sub": user["email"], "role": user["role"]},
        settings
    )
    
    return TokenResponse(
        access_token=token,
        user={
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "balance": user.get("balance", 0.0)
        }
    )
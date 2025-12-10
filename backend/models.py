from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class GameStatus(str, Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    FINISHED = "finished"
    CANCELLED = "cancelled"

class BetStatus(str, Enum):
    PENDING = "pending"
    MATCHED = "matched"
    WON = "won"
    LOST = "lost"
    CANCELLED = "cancelled"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    BET_PLACED = "bet_placed"
    BET_WON = "bet_won"
    BET_REFUND = "bet_refund"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

# Auth Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    cpf: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# User Models
class UserProfile(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    balance: float
    cpf: Optional[str] = None
    created_at: datetime

# Game Models
class GameCreate(BaseModel):
    player_a: str
    player_b: str
    match_date: datetime
    description: Optional[str] = None

class GameResponse(BaseModel):
    id: str
    player_a: str
    player_b: str
    match_date: datetime
    status: GameStatus
    description: Optional[str] = None
    total_bets_a: float = 0
    total_bets_b: float = 0
    created_at: datetime

class GameUpdate(BaseModel):
    status: Optional[GameStatus] = None
    winner: Optional[str] = None

# Bet Models
class BetCreate(BaseModel):
    game_id: str
    player_choice: str
    amount: float

class BetResponse(BaseModel):
    id: str
    game_id: str
    user_email: str
    player_choice: str
    amount: float
    matched_amount: float
    status: BetStatus
    created_at: datetime

# Transaction Models
class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float
    pix_key: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_email: str
    type: TransactionType
    amount: float
    status: TransactionStatus
    pix_key: Optional[str] = None
    pix_code: Optional[str] = None
    created_at: datetime

# Activity Log Model
class ActivityLog(BaseModel):
    user_email: str
    action: str
    details: dict
    ip_address: Optional[str] = None
    timestamp: datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def setup_indexes():
    """Create indexes on MongoDB collections"""
    
    # Users indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("cpf", unique=True, sparse=True)
    await db.users.create_index("role")
    await db.users.create_index("created_at", -1)
    
    # Games indexes
    await db.games.create_index("status")
    await db.games.create_index("created_at", -1)
    await db.games.create_index("match_date")
    
    # Bets indexes
    await db.bets.create_index("game_id")
    await db.bets.create_index("user_email")
    await db.bets.create_index("status")
    await db.bets.create_index("created_at", -1)
    
    # Transactions indexes
    await db.transactions.create_index("user_email")
    await db.transactions.create_index("type")
    await db.transactions.create_index("status")
    await db.transactions.create_index("created_at", -1)
    
    # Activity logs indexes
    await db.activity_logs.create_index("user_email")
    await db.activity_logs.create_index("action")
    await db.activity_logs.create_index("timestamp", -1)
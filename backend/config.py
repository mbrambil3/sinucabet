from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    mongo_url: str
    db_name: str
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings(
        mongo_url=os.environ.get('MONGO_URL'),
        db_name=os.environ.get('DB_NAME')
    )
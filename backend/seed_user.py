import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt
import models
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def run():
    db = SessionLocal()
    email = "krishnaroyalh@gmail.com"
    password = "Krishna@913320"
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            name="Krishna Royal",
            role="admin",
            password_hash=hash_password(password),
            auth_provider="local",
            status="active"
        )
        db.add(user)
    else:
        user.password_hash = hash_password(password)
        user.role = "admin"
        user.status = "active"
        user.auth_provider = "local"
    
    db.commit()
    print(f"User {email} seeded successfully!")

if __name__ == "__main__":
    run()

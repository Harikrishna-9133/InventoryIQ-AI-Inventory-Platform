import os
from pathlib import Path
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run():
    queries = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;",
        "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;"
    ]
    with engine.connect() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
            except Exception as e:
                print(f"Skipping error (maybe column exists): {e}")
        conn.commit()
    print("Migration successful.")

if __name__ == "__main__":
    run()

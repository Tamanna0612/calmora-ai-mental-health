from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os
import logging

# ============================================
# LOAD ENV VARIABLES
# ============================================

load_dotenv()

# Get database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback to SQLite if .env not set (local dev)
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./calmora.db"

# FIX: Render PostgreSQL gives URLs starting with "postgres://"
# but SQLAlchemy 1.4+ requires "postgresql://" — auto-correct it
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ============================================
# CREATE DATABASE ENGINE
# ============================================

# FIX: connect_args={"check_same_thread": False} is SQLite-only
# Applying it to PostgreSQL causes a crash — guarded here
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    # FIX: Connection pool settings for PostgreSQL stability on Render/Railway
    # SQLite ignores these safely
    pool_pre_ping=True,   # Test connection before using — handles dropped connections
    pool_recycle=300,     # Recycle connections every 5 min — prevents stale connection errors
)


# ============================================
# SESSION CONFIGURATION
# ============================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ============================================
# BASE CLASS FOR ALL MODELS
# ============================================

Base = declarative_base()

# ============================================
# DATABASE DEPENDENCY (FastAPI)
# ============================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================
# STARTUP CONNECTION CHECK
# ============================================

def check_db_connection():
    """
    Call this once on app startup (in main.py) to verify
    the database is reachable before accepting requests.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_type = "SQLite" if DATABASE_URL.startswith("sqlite") else "PostgreSQL"
        logging.info(f"✅ Database connected ({db_type})")
    except Exception as e:
        logging.error(f"❌ Database connection failed: {e}")
        raise
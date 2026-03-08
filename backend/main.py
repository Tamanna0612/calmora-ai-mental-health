# ==========================================
# IMPORTS
# ==========================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import engine, Base, check_db_connection
import models  # VERY IMPORTANT: loads all models

from auth import router as auth_router
from chat import router as chat_router
from mood import router as mood_router


# ==========================================
# LOAD ENV VARIABLES
# ==========================================
load_dotenv()


# ==========================================
# CREATE DATABASE TABLES + VERIFY CONNECTION
# ==========================================
Base.metadata.create_all(bind=engine)
check_db_connection()  # Logs DB type and fails fast if DB is unreachable


# ==========================================
# FASTAPI APP INITIALIZATION
# ==========================================
app = FastAPI(
    title="Calmora Mental Health API",
    description="AI Mental Health Companion Backend",
    version="1.0.0"
)


# ==========================================
# CORS CONFIGURATION (Frontend Connection)
# ==========================================
origins = [
    "http://localhost:3000",   # React
    "http://localhost:5173",   
    "https://calmora-ai.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # Change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# INCLUDE ROUTERS
# ==========================================
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(mood_router, prefix="/mood", tags=["Mood Tracking"])


# ==========================================
# ROOT ROUTE
# ==========================================
@app.get("/")
def root():
    return {
        "message": "Calmora Backend Running 💙",
        "status": "Active",
        "version": "1.0.0"
    }


# ==========================================
# HEALTH CHECK ROUTE
# ==========================================
@app.get("/health")
def health_check():
    return {
        "status": "Healthy",
        "database": "Connected",
    }
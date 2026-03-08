# ==========================================
# IMPORTS
# ==========================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from fastapi.responses import Response

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
check_db_connection()


# ==========================================
# FASTAPI APP INITIALIZATION
# ==========================================
app = FastAPI(
    title="Calmora Mental Health API",
    description="AI Mental Health Companion Backend",
    version="1.0.0"
)


# ==========================================
# CORS CONFIGURATION (FIXED)
# ==========================================
#
# ❌ BUG (your original code):
#      allow_origins=["*"] + allow_credentials=True
#      Browser spec FORBIDS this combo — every preflight fails.
#      Also: you had an `origins` list above that was never used!
#
# ✅ FIX: pass `origins` list to allow_origins (not ["*"])
#
# To add your Vercel/Netlify URL in production, either:
#   1. Add it to the list below, OR
#   2. Set env var on Render:  ALLOWED_ORIGINS=https://your-site.vercel.app
# ==========================================

origins = [
    # Local development
    "http://localhost:3000",       # React CRA / Next.js
    "http://localhost:5173",       # Vite
    "http://localhost:5174",       # Vite (alt port)
    "http://localhost:5500",       # VS Code Live Server
    "http://127.0.0.1:5500",      # VS Code Live Server (IP form)
    "http://localhost:4200",       # Angular
    "http://localhost:8080",       # Vue / generic
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "null",                        # file:// (open HTML directly in browser)

    # Production
    "https://calmora-ai.netlify.app",
    # Add your Vercel URL here, e.g.:
    # "https://calmora.vercel.app",
]

# Optional: add extra origins from Render environment variable
_extra = os.getenv("ALLOWED_ORIGINS", "")
for _o in _extra.split(","):
    _o = _o.strip()
    if _o and _o not in origins:
        origins.append(_o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,         # ✅ uses the list, NOT ["*"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
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


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)


# ==========================================
# CORS DEBUG (remove after confirming fix)
# ==========================================
@app.get("/cors-test")
def cors_test():
    return {"cors": "OK", "allowed_origins": origins}
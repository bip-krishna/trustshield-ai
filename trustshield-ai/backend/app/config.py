import os
import secrets

# S-01: Require SECRET_KEY from environment, no hardcoded fallback
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY or SECRET_KEY in (
    "CHANGE_ME_GENERATE_A_STRONG_SECRET_KEY",
    "trustshield-ai-secret-key-change-in-production",
    "trustshield-ai-production-secret-key-change-me",
):
    # Auto-generate a secret for development convenience, but warn
    SECRET_KEY = secrets.token_urlsafe(64)
    print("WARNING: SECRET_KEY not set. A random key was generated. Sessions will not persist across restarts.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trustshield.db")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@trustshield.ai")
OTP_EXPIRE_MINUTES = 5

# S-02: Admin credentials from environment only
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@trustshield.ai")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
if not ADMIN_PASSWORD or ADMIN_PASSWORD == "CHANGE_ME_USE_A_STRONG_PASSWORD":
    ADMIN_PASSWORD = secrets.token_urlsafe(16)
    print(f"WARNING: ADMIN_PASSWORD not set. Generated temporary password: {ADMIN_PASSWORD}")

# S-14: CORS origins from environment
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Minimum password length for registration
MIN_PASSWORD_LENGTH = 8

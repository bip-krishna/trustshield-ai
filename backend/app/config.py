import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trustshield.db")
SECRET_KEY = os.getenv("SECRET_KEY", "trustshield-ai-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@trustshield.ai")
OTP_EXPIRE_MINUTES = 5
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@trustshield.ai")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

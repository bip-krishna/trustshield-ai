from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from ..database import get_db
from ..models import User, OTP
from ..schemas import OTPVerify, OTPResponse
from ..services.email import send_otp_email
from ..auth import create_access_token

router = APIRouter(prefix="/api/otp", tags=["OTP"])


# S-11: Use cryptographically secure OTP generation
def generate_otp() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(6))


@router.post("/send")
async def send_otp(data: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    otp_entry = OTP(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=expires_at,
    )
    db.add(otp_entry)
    db.commit()

    email_sent = send_otp_email(user.email, otp_code)
    # S-09: Never leak OTP code in API response
    if not email_sent:
        # Log OTP server-side so devs can retrieve it from docker logs
        import logging
        logging.warning(f"OTP for {user.email}: {otp_code} (email not configured)")
    return {
        "message": "OTP sent to email" if email_sent else "OTP generated (email not configured, check server logs)",
        "expires_in_minutes": 5,
    }


@router.post("/verify")
async def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # B-02: Use .is_(False) instead of == False for SQLAlchemy boolean comparison
    otp_entry = db.query(OTP).filter(
        OTP.user_id == user.id,
        OTP.otp_code == data.otp_code,
        OTP.is_used.is_(False),
        OTP.expires_at > datetime.utcnow(),
    ).order_by(OTP.created_at.desc()).first()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp_entry.is_used = True
    user.failed_login_attempts = 0
    user.last_login = datetime.utcnow()
    # B-03: Removed face_embedding corruption (was setting to "" if not present)

    db.commit()

    token = create_access_token({"sub": user.id})
    from ..schemas import UserResponse
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
        "message": "OTP verified successfully",
    }


@router.post("/resend")
async def resend_otp(data: OTPVerify, db: Session = Depends(get_db)):
    return await send_otp(data, db)

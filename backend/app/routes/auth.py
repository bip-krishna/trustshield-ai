from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import User, DeviceFingerprint, LoginHistory, RiskEvent
from ..schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from ..auth import hash_password, verify_password, create_access_token, get_current_user
from ..risk_engine import calculate_total_risk
from ..services.geoip import get_location_from_ip

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        profile_image=data.profile_image,
        face_embedding=data.face_embedding,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login")
async def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is suspended")

    ip_address = request.client.host if request.client else "127.0.0.1"
    location = await get_location_from_ip(ip_address)

    device_fingerprint = ""
    device_name = ""
    if data.device_data:
        device_fingerprint = data.device_data.get("device_fingerprint", "")
        device_name = data.device_data.get("device_name", "")

        existing_device = db.query(DeviceFingerprint).filter(
            DeviceFingerprint.user_id == user.id,
            DeviceFingerprint.device_fingerprint == device_fingerprint,
        ).first()

        if not existing_device and device_fingerprint:
            existing_device = DeviceFingerprint(
                user_id=user.id,
                device_name=data.device_data.get("device_name"),
                browser=data.device_data.get("browser"),
                operating_system=data.device_data.get("operating_system"),
                screen_resolution=data.device_data.get("screen_resolution"),
                device_fingerprint=device_fingerprint,
            )
            db.add(existing_device)
        elif existing_device:
            existing_device.last_seen = datetime.utcnow()
        db.commit()

    risk_result = calculate_total_risk(user, db, {
        "device_fingerprint": device_fingerprint,
        "city": location.get("city"),
        "country": location.get("country"),
        "latitude": location.get("latitude", 0),
        "longitude": location.get("longitude", 0),
    })

    login_entry = LoginHistory(
        user_id=user.id,
        ip_address=ip_address,
        city=location.get("city"),
        country=location.get("country"),
        latitude=location.get("latitude"),
        longitude=location.get("longitude"),
        device_name=device_name,
        risk_score=risk_result["risk_score"],
        status=risk_result["status"],
    )
    db.add(login_entry)

    if risk_result["status"] == "allowed":
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        token = create_access_token({"sub": user.id})
        db.commit()

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user),
            "risk_score": risk_result["risk_score"],
            "risk_status": risk_result["status"],
        }

    if risk_result["status"] == "blocked":
        db.commit()
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Access Blocked Due To High Risk Activity",
                "risk_score": risk_result["risk_score"],
                "status": "blocked",
            },
        )

    db.commit()

    return {
        "access_token": None,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
        "risk_score": risk_result["risk_score"],
        "risk_status": risk_result["status"],
        "message": "Additional verification required",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

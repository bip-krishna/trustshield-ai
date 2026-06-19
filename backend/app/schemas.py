from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    profile_image: Optional[str] = None
    face_embedding: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str
    device_data: Optional[dict] = None
    ip_address: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    profile_image: Optional[str] = None
    is_active: bool
    is_admin: bool
    trust_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class DeviceData(BaseModel):
    device_name: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    screen_resolution: Optional[str] = None
    device_fingerprint: str


class TransactionCreate(BaseModel):
    recipient: str
    amount: float
    device_data: Optional[DeviceData] = None


class TransactionResponse(BaseModel):
    id: int
    recipient: str
    amount: float
    risk_score: float
    status: str
    transaction_time: datetime

    class Config:
        from_attributes = True


class LoginHistoryResponse(BaseModel):
    id: int
    ip_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    device_name: Optional[str] = None
    risk_score: float
    status: str
    login_time: datetime

    class Config:
        from_attributes = True


class DeviceResponse(BaseModel):
    id: int
    device_name: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    screen_resolution: Optional[str] = None
    is_trusted: bool
    last_seen: datetime

    class Config:
        from_attributes = True


class RiskEventResponse(BaseModel):
    id: int
    event_type: str
    risk_points: int
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OTPVerify(BaseModel):
    email: str
    otp_code: str


class OTPResponse(BaseModel):
    message: str
    expires_in_minutes: int = 5


class FaceVerifyRequest(BaseModel):
    email: str
    face_embedding: str


class RiskScoreResponse(BaseModel):
    risk_score: float
    status: str
    details: dict


class AuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int] = None
    action: str
    target_user: Optional[int] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class AdminAction(BaseModel):
    action: str
    target_user_id: int

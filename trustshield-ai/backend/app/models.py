from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, LargeBinary, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    profile_image = Column(Text, nullable=True)
    face_embedding = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    trust_score = Column(Float, default=100.0)
    failed_login_attempts = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    avg_transaction_amount = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)

    devices = relationship("DeviceFingerprint", back_populates="user", cascade="all, delete")
    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete")
    risk_events = relationship("RiskEvent", back_populates="user", cascade="all, delete")


class DeviceFingerprint(Base):
    __tablename__ = "device_fingerprints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_name = Column(String(200), nullable=True)
    browser = Column(String(100), nullable=True)
    operating_system = Column(String(100), nullable=True)
    screen_resolution = Column(String(50), nullable=True)
    device_fingerprint = Column(String(500), nullable=False, index=True)
    is_trusted = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="devices")


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    device_name = Column(String(200), nullable=True)
    risk_score = Column(Float, default=0.0)
    status = Column(String(20), default="pending")
    login_time = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="login_history")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    risk_score = Column(Float, default=0.0)
    status = Column(String(20), default="pending")
    transaction_time = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String(100), nullable=False)
    risk_points = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="risk_events")


class OTP(Base):
    __tablename__ = "otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=True)
    action = Column(String(200), nullable=False)
    target_user = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

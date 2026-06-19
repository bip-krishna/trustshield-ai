from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from ..database import get_db
from ..models import User, DeviceFingerprint, LoginHistory, Transaction, AuditLog, RiskEvent
from ..schemas import UserResponse, DeviceResponse, AuditLogResponse
from ..auth import get_admin_user, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
async def get_users(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "trust_score": u.trust_score,
            "created_at": u.created_at.isoformat(),
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "failed_login_attempts": u.failed_login_attempts,
        }
        for u in users
    ]


@router.put("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    audit = AuditLog(
        admin_id=admin.id,
        action=f"{'Suspended' if not user.is_active else 'Activated'} user {user.email}",
        target_user=user_id,
    )
    db.add(audit)
    db.commit()
    return {"message": f"User {'suspended' if not user.is_active else 'activated'}", "is_active": user.is_active}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    audit = AuditLog(
        admin_id=admin.id,
        action=f"Deleted user {user.email}",
        target_user=user_id,
    )
    db.add(audit)
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_password = "TrustShield@123"
    user.password_hash = hash_password(new_password)
    audit = AuditLog(
        admin_id=admin.id,
        action=f"Reset password for user {user.email}",
        target_user=user_id,
    )
    db.add(audit)
    db.commit()
    return {"message": "Password reset", "new_password": new_password}


@router.get("/devices")
async def get_all_devices(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    devices = db.query(DeviceFingerprint).order_by(DeviceFingerprint.last_seen.desc()).limit(100).all()
    return [
        {
            "id": d.id,
            "user_id": d.user_id,
            "device_name": d.device_name,
            "browser": d.browser,
            "operating_system": d.operating_system,
            "screen_resolution": d.screen_resolution,
            "is_trusted": d.is_trusted,
            "last_seen": d.last_seen.isoformat(),
        }
        for d in devices
    ]


@router.put("/devices/{device_id}/toggle-trust")
async def toggle_device_trust(
    device_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    device = db.query(DeviceFingerprint).filter(DeviceFingerprint.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    device.is_trusted = not device.is_trusted
    audit = AuditLog(
        admin_id=admin.id,
        action=f"{'Trusted' if device.is_trusted else 'Untrusted'} device {device.device_name}",
        target_user=device.user_id,
    )
    db.add(audit)
    db.commit()
    return {"message": "Device trust updated", "is_trusted": device.is_trusted}


@router.delete("/devices/{device_id}")
async def delete_device(
    device_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    device = db.query(DeviceFingerprint).filter(DeviceFingerprint.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted"}


@router.get("/monitoring")
async def get_monitoring(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    last_hour = now - timedelta(hours=1)

    active_users = db.query(User).filter(User.is_active == True).count()
    total_users = db.query(User).count()
    blocked_count = db.query(LoginHistory).filter(
        LoginHistory.status == "blocked",
        LoginHistory.login_time > last_hour,
    ).count()
    otp_count = db.query(LoginHistory).filter(
        LoginHistory.status == "otp_required",
        LoginHistory.login_time > last_hour,
    ).count()
    face_count = db.query(LoginHistory).filter(
        LoginHistory.status == "face_required",
        LoginHistory.login_time > last_hour,
    ).count()
    high_risk_events = db.query(RiskEvent).filter(
        RiskEvent.created_at > last_hour,
        RiskEvent.risk_points > 50,
    ).count()
    recent_logins = db.query(LoginHistory).order_by(
        LoginHistory.login_time.desc()
    ).limit(20).all()

    return {
        "active_users": active_users,
        "total_users": total_users,
        "blocked_users": blocked_count,
        "otp_requests": otp_count,
        "face_verifications": face_count,
        "high_risk_events": high_risk_events,
        "recent_logins": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "ip_address": l.ip_address,
                "city": l.city,
                "country": l.country,
                "risk_score": l.risk_score,
                "status": l.status,
                "login_time": l.login_time.isoformat(),
            }
            for l in recent_logins
        ],
    }


@router.get("/audit")
async def get_audit_logs(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "admin_id": l.admin_id,
            "action": l.action,
            "target_user": l.target_user,
            "timestamp": l.timestamp.isoformat(),
        }
        for l in logs
    ]


@router.get("/analytics")
async def get_analytics(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    last_7_days = now - timedelta(days=7)

    risk_distribution = {
        "low": db.query(LoginHistory).filter(
            LoginHistory.risk_score <= 20,
            LoginHistory.login_time > last_7_days,
        ).count(),
        "medium": db.query(LoginHistory).filter(
            LoginHistory.risk_score > 20,
            LoginHistory.risk_score <= 50,
            LoginHistory.login_time > last_7_days,
        ).count(),
        "high": db.query(LoginHistory).filter(
            LoginHistory.risk_score > 50,
            LoginHistory.risk_score <= 80,
            LoginHistory.login_time > last_7_days,
        ).count(),
        "critical": db.query(LoginHistory).filter(
            LoginHistory.risk_score > 80,
            LoginHistory.login_time > last_7_days,
        ).count(),
    }

    login_locations = db.query(
        LoginHistory.city, LoginHistory.country
    ).filter(
        LoginHistory.login_time > last_7_days,
    ).distinct().all()

    device_usage = db.query(
        DeviceFingerprint.browser,
    ).distinct().all()

    transaction_trends = db.query(Transaction).filter(
        Transaction.transaction_time > last_7_days,
    ).all()

    daily_amounts = {}
    for t in transaction_trends:
        day = t.transaction_time.strftime("%Y-%m-%d")
        daily_amounts[day] = daily_amounts.get(day, 0) + t.amount

    fraud_attempts = db.query(RiskEvent).filter(
        RiskEvent.created_at > last_7_days,
    ).count()

    return {
        "risk_distribution": risk_distribution,
        "login_locations": [{"city": l[0], "country": l[1]} for l in login_locations if l[0]],
        "device_usage": [{"browser": d[0]} for d in device_usage if d[0]],
        "transaction_trends": [{"date": k, "amount": v} for k, v in sorted(daily_amounts.items())],
        "fraud_attempts": fraud_attempts,
    }

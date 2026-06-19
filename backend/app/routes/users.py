from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, LoginHistory, Transaction, RiskEvent
from ..schemas import UserResponse, LoginHistoryResponse, TransactionResponse, RiskEventResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recent_logins = db.query(LoginHistory).filter(
        LoginHistory.user_id == current_user.id,
    ).order_by(LoginHistory.login_time.desc()).limit(10).all()

    recent_transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
    ).order_by(Transaction.transaction_time.desc()).limit(10).all()

    risk_events = db.query(RiskEvent).filter(
        RiskEvent.user_id == current_user.id,
    ).order_by(RiskEvent.created_at.desc()).limit(10).all()

    devices = db.query(type("DeviceImport", (), {})) if False else []
    from ..models import DeviceFingerprint
    trusted_devices = db.query(DeviceFingerprint).filter(
        DeviceFingerprint.user_id == current_user.id,
        DeviceFingerprint.is_trusted == True,
    ).all()

    return {
        "user": UserResponse.model_validate(current_user),
        "recent_logins": [LoginHistoryResponse.model_validate(l) for l in recent_logins],
        "recent_transactions": [TransactionResponse.model_validate(t) for t in recent_transactions],
        "risk_events": [RiskEventResponse.model_validate(r) for r in risk_events],
        "trusted_devices": [
            {
                "id": d.id,
                "device_name": d.device_name,
                "browser": d.browser,
                "operating_system": d.operating_system,
                "is_trusted": d.is_trusted,
                "last_seen": d.last_seen.isoformat(),
            }
            for d in trusted_devices
        ],
        "trust_score": current_user.trust_score,
    }

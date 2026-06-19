from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, RiskEvent
from ..schemas import RiskScoreResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/risk", tags=["Risk"])


@router.get("/score")
async def get_risk_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return RiskScoreResponse(
        risk_score=100 - current_user.trust_score,
        status="active" if current_user.is_active else "suspended",
        details={"trust_score": current_user.trust_score},
    )


@router.get("/events")
async def get_risk_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    events = db.query(RiskEvent).filter(
        RiskEvent.user_id == current_user.id,
    ).order_by(RiskEvent.created_at.desc()).limit(20).all()

    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "risk_points": e.risk_points,
            "description": e.description,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]

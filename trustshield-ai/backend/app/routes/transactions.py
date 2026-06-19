from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from ..database import get_db
from ..models import User, Transaction, RiskEvent
from ..schemas import TransactionCreate, TransactionResponse
from ..auth import get_current_user
from ..risk_engine import calculate_total_risk, calculate_transaction_risk
from ..services.geoip import get_location_from_ip

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.post("/create")
async def create_transaction(
    data: TransactionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ip_address = request.client.host if request.client else "127.0.0.1"
    location = await get_location_from_ip(ip_address)

    device_fingerprint = data.device_data.device_fingerprint if data.device_data else ""

    risk_result = calculate_total_risk(current_user, db, {
        "device_fingerprint": device_fingerprint,
        "city": location.get("city"),
        "country": location.get("country"),
        "latitude": location.get("latitude", 0),
        "longitude": location.get("longitude", 0),
        "transaction_amount": data.amount,
    })

    transaction = Transaction(
        user_id=current_user.id,
        recipient=data.recipient,
        amount=data.amount,
        risk_score=risk_result["risk_score"],
        status=risk_result["status"],
    )
    db.add(transaction)

    if risk_result["status"] == "allowed":
        total_amount = current_user.avg_transaction_amount * current_user.transaction_count
        current_user.transaction_count += 1
        current_user.avg_transaction_amount = (total_amount + data.amount) / current_user.transaction_count

    db.commit()
    db.refresh(transaction)

    return {
        "transaction": TransactionResponse.model_validate(transaction),
        "risk_score": risk_result["risk_score"],
        "risk_status": risk_result["status"],
    }


@router.get("/history", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
    ).order_by(Transaction.transaction_time.desc()).limit(20).all()
    return [TransactionResponse.model_validate(t) for t in transactions]

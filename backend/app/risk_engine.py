from datetime import datetime, timedelta
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from .models import User, DeviceFingerprint, LoginHistory, Transaction, RiskEvent
from .services.ml_service import calculate_anomaly_score
import math


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_login_risk(
    user: User,
    device_fingerprint: str,
    city: Optional[str],
    country: Optional[str],
    latitude: float,
    longitude: float,
    db: Session,
) -> Dict:
    risk_points = 0
    details = {}

    known_devices = db.query(DeviceFingerprint).filter(
        DeviceFingerprint.user_id == user.id,
        DeviceFingerprint.is_trusted.is_(True),
    ).all()
    known_fingerprints = [d.device_fingerprint for d in known_devices]

    if device_fingerprint not in known_fingerprints:
        risk_points += 25
        details["new_device"] = 25

    previous_logins = db.query(LoginHistory).filter(
        LoginHistory.user_id == user.id,
        LoginHistory.status == "allowed",
    ).order_by(LoginHistory.login_time.desc()).limit(10).all()

    known_cities = set()
    known_countries = set()
    for login in previous_logins:
        if login.city:
            known_cities.add(login.city.lower())
        if login.country:
            known_countries.add(login.country.lower())

    if city and city.lower() not in known_cities and country and country.lower() not in known_countries:
        if known_cities:
            risk_points += 20
            details["new_location"] = 20

    if user.failed_login_attempts and user.failed_login_attempts > 3:
        risk_points += 15
        details["failed_attempts"] = 15

    if previous_logins and latitude and longitude:
        latest = previous_logins[0]
        if latest.latitude and latest.longitude:
            dist = haversine_distance(latest.latitude, latest.longitude, latitude, longitude)
            time_diff = (datetime.utcnow() - latest.login_time).total_seconds() / 3600
            if dist > 1000 and time_diff < 1:
                risk_points += 35
                details["impossible_travel"] = 35

    return {"risk_points": risk_points, "details": details}


def calculate_transaction_risk(
    user: User,
    amount: float,
    db: Session,
) -> Dict:
    risk_points = 0
    details = {}

    if user.avg_transaction_amount and user.avg_transaction_amount > 0:
        if amount > 3 * user.avg_transaction_amount:
            risk_points += 30
            details["abnormal_amount"] = 30

    recent_transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.status == "completed",
    ).order_by(Transaction.transaction_time.desc()).limit(5).all()

    if recent_transactions:
        time_diffs = []
        for i in range(len(recent_transactions) - 1):
            diff = (recent_transactions[i].transaction_time - recent_transactions[i + 1].transaction_time).total_seconds()
            time_diffs.append(diff)

        if time_diffs and len(time_diffs) > 1:
            avg_diff = sum(time_diffs) / len(time_diffs)
            if avg_diff < 60:
                risk_points += 10
                details["rapid_transactions"] = 10

    return {"risk_points": risk_points, "details": details}


def calculate_ml_risk(user: User, db: Session) -> float:
    recent_logins = db.query(LoginHistory).filter(
        LoginHistory.user_id == user.id,
    ).order_by(LoginHistory.login_time.desc()).limit(20).all()

    location_changes = 0
    device_changes = 0
    seen_locations = set()
    seen_devices = set()

    for login in recent_logins:
        loc_key = f"{login.city}-{login.country}"
        if loc_key not in seen_locations:
            seen_locations.add(loc_key)
            location_changes += 1
        if login.device_name and login.device_name not in seen_devices:
            seen_devices.add(login.device_name)
            device_changes += 1

    recent_trans = db.query(Transaction).filter(
        Transaction.user_id == user.id,
    ).order_by(Transaction.transaction_time.desc()).limit(10).all()

    avg_amount = sum(t.amount for t in recent_trans) / max(len(recent_trans), 1)

    login_hour = datetime.utcnow().hour

    ml_risk = calculate_anomaly_score(
        transaction_amount=avg_amount,
        login_hour=login_hour,
        location_changes=location_changes,
        device_changes=device_changes,
    )
    return ml_risk


def calculate_total_risk(user: User, db: Session, context: Dict) -> Dict:
    login_risk = calculate_login_risk(
        user=user,
        device_fingerprint=context.get("device_fingerprint", ""),
        city=context.get("city"),
        country=context.get("country"),
        latitude=context.get("latitude", 0),
        longitude=context.get("longitude", 0),
        db=db,
    )

    transaction_risk = {"risk_points": 0, "details": {}}
    if context.get("transaction_amount"):
        transaction_risk = calculate_transaction_risk(
            user=user, amount=context["transaction_amount"], db=db
        )

    ml_risk = calculate_ml_risk(user=user, db=db)

    total_risk = login_risk["risk_points"] + transaction_risk["risk_points"] + ml_risk
    total_risk = max(0, min(100, total_risk))

    all_details = {**login_risk["details"], **transaction_risk["details"]}

    if total_risk <= 20:
        status = "allowed"
    elif total_risk <= 50:
        status = "otp_required"
    elif total_risk <= 80:
        if user.face_embedding:
            status = "face_required"
        else:
            status = "otp_required"
    else:
        status = "blocked"

    if status == "blocked":
        event = RiskEvent(
            user_id=user.id,
            event_type="high_risk_block",
            risk_points=int(total_risk),
            description=f"Access blocked. Score: {total_risk}. Reasons: {all_details}",
        )
        db.add(event)
        db.commit()

    return {
        "risk_score": total_risk,
        "status": status,
        "details": all_details,
    }

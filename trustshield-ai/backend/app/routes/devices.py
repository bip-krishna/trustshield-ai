from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, DeviceFingerprint
from ..schemas import DeviceResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/devices", tags=["Devices"])


@router.get("/", response_model=List[DeviceResponse])
async def get_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    devices = db.query(DeviceFingerprint).filter(
        DeviceFingerprint.user_id == current_user.id,
    ).order_by(DeviceFingerprint.last_seen.desc()).all()
    return [DeviceResponse.model_validate(d) for d in devices]


@router.post("/{device_id}/trust")
async def toggle_trust(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(DeviceFingerprint).filter(
        DeviceFingerprint.id == device_id,
        DeviceFingerprint.user_id == current_user.id,
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    device.is_trusted = not device.is_trusted
    db.commit()
    return {"message": "Device trust toggled", "is_trusted": device.is_trusted}


@router.delete("/{device_id}")
async def remove_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.query(DeviceFingerprint).filter(
        DeviceFingerprint.id == device_id,
        DeviceFingerprint.user_id == current_user.id,
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device removed"}

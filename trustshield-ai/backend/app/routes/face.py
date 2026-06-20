from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import numpy as np
from ..database import get_db
from ..models import User
from ..schemas import FaceVerifyRequest
from ..auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/face", tags=["Face Verification"])


def cosine_similarity(embedding1: str, embedding2: str) -> float:
    try:
        arr1 = np.array([float(x) for x in embedding1.split(",")])
        arr2 = np.array([float(x) for x in embedding2.split(",")])
        if len(arr1) != len(arr2):
            return 0.0
        dot = np.dot(arr1, arr2)
        norm1 = np.linalg.norm(arr1)
        norm2 = np.linalg.norm(arr2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot / (norm1 * norm2))
    except Exception:
        return 0.0


@router.post("/verify")
async def verify_face(data: FaceVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.face_embedding:
        raise HTTPException(status_code=400, detail="No face enrollment found. Please register first.")

    similarity = cosine_similarity(user.face_embedding, data.face_embedding)
    threshold = 0.6

    if similarity >= threshold:
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        db.commit()

        token = create_access_token({"sub": user.id})
        from ..schemas import UserResponse
        return {
            "verified": True,
            "similarity": similarity,
            "access_token": token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user),
            "message": "Face verified successfully",
        }
    else:
        return {
            "verified": False,
            "similarity": similarity,
            "message": "Face verification failed. Access denied.",
        }


# S-12: Face enrollment now requires authentication — prevents
# attackers from overwriting another user's face embedding by knowing their email
@router.post("/enroll")
async def enroll_face(
    data: FaceVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only allow users to enroll their own face
    if data.email != current_user.email:
        raise HTTPException(
            status_code=403,
            detail="You can only enroll your own face embedding",
        )

    current_user.face_embedding = data.face_embedding
    db.commit()

    return {"message": "Face enrolled successfully"}

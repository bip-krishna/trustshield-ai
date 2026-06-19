from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base, SessionLocal
from .models import User
from .routes import auth, otp, face, transactions, devices, users, admin, risk
from .auth import hash_password
from .config import ADMIN_EMAIL, ADMIN_PASSWORD

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TrustShield AI - Identity Trust Engine",
    description="AI-powered banking identity trust and risk management system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(otp.router)
app.include_router(face.router)
app.include_router(transactions.router)
app.include_router(devices.router)
app.include_router(users.router)
app.include_router(risk.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                full_name="Admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) if str(exc) else "Internal server error"},
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "TrustShield AI"}

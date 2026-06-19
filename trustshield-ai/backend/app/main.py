from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base, SessionLocal
from .models import User
from .routes import auth, otp, face, transactions, devices, users, admin, risk
from .auth import hash_password
from .config import ADMIN_EMAIL, ADMIN_PASSWORD, CORS_ORIGINS

Base.metadata.create_all(bind=engine)


# S-16: Use lifespan context manager instead of deprecated on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create admin user if not exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                full_name="Admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                is_admin=True,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="TrustShield AI - Identity Trust Engine",
    description="AI-powered banking identity trust and risk management system",
    version="1.0.0",
    lifespan=lifespan,
)

# S-14: Restrict CORS to configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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


# S-15: Sanitize exception messages — do not leak internals
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the real error server-side
    import logging
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "TrustShield AI"}

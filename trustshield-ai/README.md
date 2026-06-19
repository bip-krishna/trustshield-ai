# TrustShield AI - Identity Trust Engine for Banking

An AI-powered Identity Trust Engine that continuously evaluates user trust during login and transactions, generates real-time risk scores, and dynamically decides whether to allow access, trigger OTP verification, require face verification, or block access.

## Features

- **AI Risk Analysis Engine** - Hybrid scoring with Isolation Forest ML model
- **Real-time Risk Scoring** - 0-100 risk score with live dashboard
- **Multi-factor Authentication** - OTP email verification & face recognition
- **Device Fingerprinting** - Automatic device identification and tracking
- **Location Tracking** - GeoIP-based location monitoring
- **Behavioral Analysis** - Pattern detection for fraud prevention
- **Admin Dashboard** - Complete system monitoring and control
- **Analytics** - Risk distribution, trends, and fraud detection charts

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, Framer Motion, Recharts
- **Backend:** FastAPI, SQLAlchemy, SQLite
- **AI/ML:** Scikit-Learn, Isolation Forest
- **Auth:** JWT, bcrypt, OTP Email Service
- **Deployment:** Docker, Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Or Python 3.11+ and Node.js 20+

### Environment Setup

> **⚠️ Security Notice:** Before running the application, you MUST configure your environment variables.

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and set a strong SECRET_KEY and ADMIN_PASSWORD
# Generate a secret key:
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Using Docker (Recommended)

```bash
docker-compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Manual Setup

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## Admin Access

Admin credentials are configured via environment variables (`ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file). See `.env.example` for details.

## Risk Decision Engine

| Risk Score | Status | Action |
|------------|--------|--------|
| 0-20 | ALLOW | Direct access granted |
| 21-50 | OTP | Email OTP verification required |
| 51-80 | FACE | Live face verification required |
| 81-100 | BLOCK | Access denied, admin alerted |

## Demo Scenarios

1. **Known Device + Known Location + Normal Transaction** → Score: 10 → Allowed
2. **New Device** → Score: 25 → OTP Verification
3. **New Device + New Location + Large Transaction** → Score: 65 → Face Verification
4. **New Device + Impossible Travel + Abnormal Transaction** → Score: 90 → Blocked

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with risk evaluation
- `POST /api/otp/send` - Send OTP email
- `POST /api/otp/verify` - Verify OTP code
- `POST /api/face/verify` - Verify face embedding
- `POST /api/face/enroll` - Enroll face embedding (requires auth)
- `POST /api/transactions/create` - Create transaction with risk check
- `GET /api/users/dashboard` - User dashboard data
- `GET /api/admin/*` - Admin endpoints

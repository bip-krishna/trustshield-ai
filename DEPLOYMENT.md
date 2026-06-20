# Vercel Deployment Guide

Deploying TrustShield AI requires deploying the frontend to Vercel and the backend to a provider that supports persistent file storage (or migrating to PostgreSQL) due to the use of SQLite and heavyweight ML libraries (`scikit-learn`).

Here is the step-by-step guide to get your application live.

---

## Part 1: Deploying the Frontend (Vercel)

The Next.js frontend is 100% ready for Vercel. Because the project uses a monorepo structure (frontend and backend in the same repo), you just need to tell Vercel where the frontend code lives.

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Vercel](https://vercel.com/) and click **Add New... > Project**.
3. Import your TrustShield AI repository.
4. **CRITICAL STEP**: In the "Configure Project" screen, look for **Root Directory**. Click "Edit" and select the `frontend` folder.
5. Vercel will automatically detect the **Next.js** framework.
6. Open the **Environment Variables** section and add:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g., `https://trustshield-api.onrender.com`). Leave this as `http://localhost:8000` ONLY if you are testing locally.
7. Click **Deploy**.

Vercel will install dependencies, build the static pages, and deploy your frontend globally.

---

## Part 2: Deploying the Backend (Render / Railway / Fly.io)

### Why not Vercel Serverless Functions?
While Vercel supports Python, it is not recommended for this backend for two reasons:
1. **File System limits**: Vercel Serverless has a read-only, ephemeral file system. Your SQLite database (`trustshield.db`) would be wiped every time the function spins down.
2. **Size limits**: Vercel has a 250MB limit on uncompressed serverless functions. `scikit-learn`, `numpy`, and `fastapi` combined can exceed this limit.

We recommend deploying the backend using a Docker-compatible service like **Render**, **Railway**, or **Fly.io**. 

### Example: Deploying to Render
Render natively supports Docker Compose and Dockerfile deployments.

1. Sign up for [Render](https://render.com/).
2. Click **New > Web Service**.
3. Connect your repository.
4. For the **Root Directory**, enter `backend`.
5. For the **Environment**, select `Docker`.
6. Add the following **Environment Variables** (from your `.env` file):
   - `SECRET_KEY`: A strong, randomly generated string.
   - `DATABASE_URL`: `sqlite:///./trustshield.db` (For production, consider switching to a Postgres URL like `postgresql://user:pass@host/db`)
   - `ADMIN_EMAIL`: Your admin email
   - `ADMIN_PASSWORD`: Your secure admin password
   - `CORS_ORIGINS`: Your Vercel frontend URL (e.g., `https://trustshield-frontend.vercel.app`)
   - *Add SMTP variables if you want OTP emails to work.*
7. **Important**: Under **Advanced > Disks**, add a persistent disk to save your SQLite database.
   - Name: `backend_data`
   - Mount Path: `/app`
   - Size: 1 GB
8. Click **Create Web Service**.

---

## Part 3: Connecting the Two

Once both are deployed:
1. Go to your Vercel Dashboard, select your frontend project, and go to **Settings > Environment Variables**.
2. Update `NEXT_PUBLIC_API_URL` to match your new Render backend URL (e.g., `https://your-backend.onrender.com`).
3. Redeploy the Vercel project to apply the environment variable change.
4. In your Render Dashboard, ensure `CORS_ORIGINS` includes your new Vercel URL.

Your application is now fully live!

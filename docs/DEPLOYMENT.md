# GapFinder AI — Production Deployment Guide

This guide details three tested, production-grade deployment strategies for GapFinder AI.

---

## Strategy A: Vercel (Frontend) + Render (Backend) [Recommended]

This is the standard modern stack for React SPAs + Python FastAPI backends. Both platforms provide generous free tiers.

### 1. Deploy the Backend on Render
1. Push your repository to GitHub.
2. Sign up / Log in to [Render](https://render.com).
3. Click **New +** → **Web Service** and connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name:** `gapfinder-backend`
   - **Region:** Any (e.g. Frankfurt, Oregon, Singapore)
   - **Branch:** `main`
   - **Root Directory:** Leave empty (root)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `SECRET_KEY` = *(generate any random 32-char string)*
   - `LLM_PROVIDER` = `gemini`
   - `EMBEDDING_PROVIDER` = `gemini`
   - `GEMINI_API_KEY` = `AIzaSy...` *(your Google AI Studio API key)*
   - `DATABASE_URL` = `sqlite:///./gapfinder.db` *(or your PostgreSQL URL)*
6. Click **Create Web Service**.
7. Once deployed, copy your backend URL: e.g. `https://gapfinder-backend.onrender.com`.

---

### 2. Deploy the Frontend on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project** and import your GitHub repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Build Command:** `pnpm run build` (or `npm run build`)
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://gapfinder-backend.onrender.com` *(your Render backend URL from Step 1)*
5. Click **Deploy**.
6. Vercel will build and deploy your frontend with SPA rewrites enabled via [frontend/vercel.json](file:///C:/Users/pasup/OneDrive/Documents/Projects/Gap_Finder_AI/frontend/vercel.json).

---

## Strategy B: 1-Click Render Blueprint

We have provided a ready-to-run [render.yaml](file:///C:/Users/pasup/OneDrive/Documents/Projects/Gap_Finder_AI/render.yaml) blueprint file in the repository root:

1. Push your repository to GitHub.
2. In [Render](https://dashboard.render.com), click **Blueprints** → **New Blueprint Instance**.
3. Select your repository.
4. Render will automatically detect [render.yaml](file:///C:/Users/pasup/OneDrive/Documents/Projects/Gap_Finder_AI/render.yaml) and provision:
   - The FastAPI backend web service
   - The React static site with automatic API linkage
5. Enter your `GEMINI_API_KEY` when prompted and click **Apply**.

---

## Strategy C: Docker & Self-Hosted VPS / Railway

For running on any Linux VPS (Ubuntu, Debian, AWS EC2, DigitalOcean Droplet) with Docker Compose:

1. Clone the repository onto your server:
   ```bash
   git clone <your-repo-url> gapfinder-ai
   cd gapfinder-ai
   ```
2. Create your `.env` file:
   ```bash
   cp .env.example .env
   nano .env
   # Add your GEMINI_API_KEY and set DATABASE_URL
   ```
3. Run with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
4. Verify containers:
   ```bash
   docker compose ps
   ```
   - **PostgreSQL with pgvector:** port `5432`
   - **FastAPI Backend:** port `8000`
   - **Vite/Nginx Frontend:** port `5173` (or `80`)

---

## Production Verification Checklist

After deploying, verify the live system:
- [ ] Health check returns healthy: `curl https://<your-backend-url>/health`
- [ ] Swagger API documentation loads: `https://<your-backend-url>/api/v1/docs`
- [ ] Frontend loads and theme toggle works (Light / Dark mode)
- [ ] Demo student logs in with seeded credentials or creates a new account
- [ ] Document upload and chunk extraction completes
- [ ] Diagnostic assessment generates grounded questions with page citations
- [ ] Knowledge gap report renders empirical mastery metrics
- [ ] AI Tutor responds with verified textbook source citations
- [ ] Developer portfolio page (`/portfolio`) loads

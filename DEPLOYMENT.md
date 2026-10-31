# 🚀 DevSphere Production Deployment Guide
**Full-Stack Next.js 15 (Frontend + Backend APIs + Realtime + AI Studio)**

DevSphere is architected so that both the **frontend and backend** are unified inside Next.js 15 App Router. When you deploy DevSphere, you deploy the entire platform (UI, Server Actions, 46 Route Handlers, Realtime SSE Hub, and AI Studio) simultaneously.

---

## 📋 Required Environment Variables

Configure these environment variables in your hosting provider's dashboard:

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Production mode | `production` |
| `PORT` | Web server listening port | `3000` |
| `JWT_SECRET` | 32+ character key for signing session tokens | `generate-a-strong-32-char-random-key!` |
| `SUPREME_OWNER_EMAIL` | Email of sovereign platform owner | `supreme@devsphere.io` (or your personal email) |
| `GEMINI_API_KEY` | Google Gemini API key for live AI assistant | `GEMINI_API_KEY` |
| `DATABASE_URL` *(Optional)* | PostgreSQL / Supabase connection string | `postgresql://postgres:pass@db.project.supabase.co:5432/postgres` |

> 💡 **Dual-Mode Persistence**: If `DATABASE_URL` is omitted, DevSphere automatically uses its high-speed persistent store (`data/devsphere-store.json`), meaning you can deploy immediately without setting up any external database!

---

## 🌐 Deployment Method 1: Vercel (Instant Zero-Server Hosting)

Vercel is the native cloud for Next.js and deploys both frontend and backend serverless APIs worldwide with zero configuration.

### Option A: Via GitHub (Recommended)
1. Push your DevSphere repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `devsphere` repository.
4. In **Environment Variables**, add:
   * `JWT_SECRET`: `devsphere-supreme-production-secret-key-32-chars!`
   * `SUPREME_OWNER_EMAIL`: `supreme@devsphere.io`
   * `GEMINI_API_KEY`: `GEMINI_API_KEY`
5. Click **"Deploy"**. Vercel will build and assign you a live HTTPS domain (e.g. `https://devsphere.vercel.app`) in under 2 minutes.

### Option B: Via Vercel CLI
```bash
# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Deploy directly from the project directory
vercel --prod
```

---

## 🐳 Deployment Method 2: Docker & Docker Compose (Any VPS / Server)

Deploy full-stack DevSphere with an integrated PostgreSQL 16 database and auto-migrations on any VPS (AWS EC2, DigitalOcean, Hetzner, Linode, Coolify, or CapRover).

### 1. Launch with Docker Compose
From the project root:
```bash
docker compose up -d --build
```

### What Docker Compose Automates:
* Builds the multi-stage, standalone production image (`Dockerfile`).
* Boots `devsphere-db` (PostgreSQL 16).
* Automatically executes all 3 SQL migrations (`01_schema.sql`, `02_rls.sql`, `03_seed.sql`) via `/docker-entrypoint-initdb.d/`.
* Boots `devsphere-app` on port `3000` with healthchecks.
* Sets up persistent data volumes for zero data loss across restarts.

### Verify Status:
```bash
docker compose ps
docker compose logs -f app
```
Visit `http://your-server-ip:3000`.

---

## 🚂 Deployment Method 3: Railway.app (1-Click Full-Stack)

1. Go to [railway.app](https://railway.app) and click **"New Project"**.
2. Select **"Deploy from GitHub repo"** and choose your repository.
3. Railway automatically detects `railway.json` and builds the standalone application.
4. *(Optional)* Click **"+ New"** -> **"Database"** -> **"Add PostgreSQL"** and copy the `DATABASE_URL` variable to your web service.
5. In your web service settings, add your environment variables (`JWT_SECRET`, `GEMINI_API_KEY`, etc.).
6. Generate a public domain under **Settings -> Networking**.

---

## ☁️ Deployment Method 4: Render.com (Blueprint Deployment)

1. Push your repository to GitHub.
2. Go to [render.com](https://render.com) and click **"New" -> "Blueprint"**.
3. Connect your repository. Render will automatically read [`render.yaml`](file:///C:/Users/Rakesh/.gemini/antigravity/scratch/devsphere/render.yaml).
4. Render creates the web service and persistent disk automatically.
5. Click **"Apply"** to deploy.

---

## 🗄️ Connecting a Remote PostgreSQL / Supabase Database

If you wish to host your database on Supabase or Neon:

1. Obtain your PostgreSQL connection string (URI) from your database dashboard.
2. Set `DATABASE_URL="postgresql://user:pass@host:5432/dbname"` in your `.env.local` or hosting provider settings.
3. Run the automated migration script:
   ```bash
   npm run migrate
   ```
4. The auto-migrator will apply all 44 tables, Row Level Security policies, indexes, and initial fixtures in seconds.

---

## 👑 Bootstrapping Your Supreme Owner Account in Production

Once deployed, promote your personal production account to **Supreme Sovereign**:

```bash
node scripts/bootstrap-supreme.mjs your-production-email@domain.com
```

This grants sovereign platform authority, creates an immutable audit log entry, and enables access to `/supreme`.

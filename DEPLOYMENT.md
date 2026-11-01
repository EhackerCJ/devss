# 🚀 DevSphere Production Deployment Guide
**Full-Stack Next.js 15 (Frontend + Backend APIs + Realtime + AI Studio)**

DevSphere is architected so that both the **frontend and backend** are unified inside Next.js 15 App Router. When you deploy DevSphere, you deploy the entire platform (UI, Server Actions, 46 Route Handlers, Realtime SSE Hub, and AI Studio) simultaneously.

---

## ⚡ Important Architecture Notice for Vercel vs Dedicated Hosts

### Why Vercel Requires `DATABASE_URL` for Persistent Users:
* Vercel runs Serverless Functions (AWS Lambda). Each function instance is ephemeral and stateless: instances do not share local files with each other.
* When you set `DATABASE_URL` (from Supabase, Neon, or Vercel Postgres), DevSphere automatically activates the **PostgreSQL Production Adapter**.
* The PostgreSQL adapter connects all serverless instances to the central database and automatically self-heals / auto-creates tables on first connect with zero manual configuration.
* If deploying to a dedicated host with a persistent disk (Railway with disk, Render with disk, or Docker Compose), DevSphere can also operate using its persistent local file database (`data/devsphere-store.json`).

---

## 📋 Required Environment Variables

Configure these environment variables in your hosting provider's dashboard (e.g. Vercel, Railway, Render):

### 1. Variable Names Only
* `DATABASE_URL`
* `JWT_SECRET`
* `SUPREME_OWNER_EMAIL`
* `GEMINI_API_KEY`
* `NODE_ENV`
* `PORT`

### 2. Guidance & Examples
| Variable Name | Example / Format | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` | Connection URI from Supabase, Neon, or Vercel Postgres. |
| `JWT_SECRET` | `your-32-character-random-secure-jwt-secret!` | 32+ character secret for signing sessions. |
| `SUPREME_OWNER_EMAIL` | `supreme@devsphere.io` | Your email address to receive sovereign owner role. |
| `GEMINI_API_KEY` | `your-google-gemini-api-key` | Google Gemini API key for live AI Studio & in-chat bot. |
| `NODE_ENV` | `production` | Enables production optimizations and secure cookies. |
| `PORT` | `3000` | Web server listening port. |

---

## 🌐 Deployment Method 1: Vercel (with Supabase or Neon PostgreSQL)

### Step 1: Add Database Connection URI
1. Obtain your PostgreSQL connection string from [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. In Supabase: go to **Project Settings** -> **Database** -> Copy the **Connection URI**.
3. Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

### Step 2: Configure Environment Variables in Vercel
In [vercel.com](https://vercel.com) under your project's **Settings** -> **Environment Variables**, add:
* `DATABASE_URL` = your Supabase connection URI
* `JWT_SECRET` = your secure 32+ character secret
* `SUPREME_OWNER_EMAIL` = your administrator email
* `GEMINI_API_KEY` = your Gemini API key

### Step 3: Deploy
* Trigger a deployment. DevSphere automatically detects the database and provisions the necessary tables on first launch.

---

## 🐳 Deployment Method 2: Docker & Docker Compose

Deploy full-stack DevSphere with an integrated PostgreSQL 16 database on any VPS (AWS EC2, DigitalOcean, Hetzner, Linode):

```bash
docker compose up -d --build
```

---

## 🚂 Deployment Method 3: Railway.app

1. Import your GitHub repository in [railway.app](https://railway.app).
2. Add a PostgreSQL service or set `DATABASE_URL`.
3. Set `JWT_SECRET`, `SUPREME_OWNER_EMAIL`, and `GEMINI_API_KEY` in the Variables tab.

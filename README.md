# DevSphere

> **Supreme Social + Community + Messaging + AI Coding Platform**

DevSphere is an original, mobile-first full-stack social communication and developer collaboration platform. It bridges the best interaction patterns of modern community platforms (Discord-style servers, channels, roles), social networks (Instagram-style follow graph, rich profiles, presence), and real-time messaging (1-on-1 direct messages, code blocks, emoji reactions) with an integrated autonomous **AI Coding Assistant** (powered by Google Gemini) and an administrative tier governed by a **Supreme Owner**.

---

## 🌟 Key Highlights & Capabilities

- **Platform Sovereign (Supreme Owner)**: Dedicated protected Supreme Panel (`/supreme`) with platform statistics, user management (ban, suspend, activate, verify), staff role delegation (Admin, Mod, Support), feature flag controls, and an immutable audit trail.
- **Strict Role & Permission Hierarchy**:
  - `SUPREME_OWNER` > `PLATFORM_ADMIN` > `PLATFORM_MODERATOR` > `SUPPORT` > `PREMIUM_USER` > `USER`
  - Inviolable rules: No standard API or delegated role can create another Supreme Owner or demote the Supreme Owner.
- **Social Graph Engine**:
  - Follow / Unfollow with follower/following counts and private account follow requests.
  - Mutual Friends system with friend requests (Send, Accept, Reject, Cancel, Unfriend) and mutual friends counter.
- **Direct Messaging & Real-time Chat**:
  - 1-on-1 DMs and Community Channels with real-time Server-Sent Events (SSE) streaming.
  - Formatted messages, syntax-highlighted code blocks with line numbers and a 1-click **Copy** button, and emoji reactions.
  - `@AI` summon in any channel or conversation for automated code assistance.
- **Discord-Style Community Servers**:
  - Server categories, text channels, announcement channels, AI help channels, and project channels.
  - Member directories categorized by server role (`SERVER_OWNER`, `SERVER_ADMIN`, `SERVER_MODERATOR`, `MEMBER`).
- **Autonomous AI Coding Studio (`/ai`)**:
  - Multi-turn conversation sessions powered by Google Gemini 1.5.
  - Preset quick prompts for React 19 Actions, PostgreSQL RLS policies, Rust concurrent memory-safe buffers, and TypeScript debugging.
- **Premium Subscriptions & Contact-to-Purchase Flow**:
  - Free, Pro ($12/mo), and Supreme Dev ($29/mo) plans.
  - "Contact Supreme / Request Premium" submission workflow with manual verification, reference logging, and audit tracking.
- **Trust, Safety & Moderation**:
  - User and content report submission, moderator adjudication queue, and user appeal workflow.
  - Immutable audit logs capturing every administrative action.
- **Dual-Mode Data Architecture**:
  - PostgreSQL / Supabase ready with full SQL schema migrations (`supabase/migrations/`).
  - Out-of-the-box persistent local DAL store (`data/devsphere-store.json`) for instant zero-friction local development, testing, and CI.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.14.0)
- npm 9+

### 2. Installation
```bash
# Clone or navigate to the project directory
cd devsphere

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file (already pre-configured with development defaults):
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=devsphere-supreme-super-secret-key-32-chars-long!
SUPREME_OWNER_EMAIL=supreme@devsphere.io

# Optional: Add your Google Gemini API key to enable live Gemini API calls
GEMINI_API_KEY=

# Optional: Remote PostgreSQL / Supabase connection
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Test Suite

DevSphere includes comprehensive automated unit and integration tests covering:
- Authentication & JWT session security
- Supreme Owner sovereignty & anti-escalation defenses
- Social graph follow & mutual friends logic
- Real-time messaging and code block parsing

Run the tests:
```bash
npm test
```
All 11 automated test suites pass with 0 failures!

---

## 👥 Pre-Configured Secured Accounts & Roles

DevSphere ships with distinct, production-grade secured passwords across administrative, moderation, and community tiers:

| Role | Email | Username | Secure Password | Access & Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Supreme Owner** | `supreme@devsphere.io` | `supreme` | `Supreme#Sovereign$2026!Key` | Absolute platform sovereignty, access to `/supreme` |
| **Platform Admin** | `admin@devsphere.io` | `alex_admin` | `Admin#Vault&9821*Shield` | Platform oversight & user management, access to `/admin` |
| **Platform Moderator** | `mod@devsphere.io` | `mira_mod` | `Mod#SafeGuard%4172!Trust` | Report adjudication & safety queue, access to `/moderator` |
| **Support Staff** | `support@devsphere.io` | `sam_support` | `Support#Desk&6319@Assist` | Community assistance & member ticketing |
| **Premium Pro** | `pro@devsphere.io` | `dev_pro` | `DevPro#Coding$7824!Nova` | Pro badge, expanded quotas, priority AI features |
| **Community Member** | `member@devsphere.io` | `sarah_coder` | `Member#Sarah@2026!Code` | Standard verified developer profile |
| **Standard User** | `jordan@devsphere.io` | `jordan_dev` | `Member#Jordan@2026!Dev` | Standard developer user |

> **Pro-Tip**: The login page (`/login`) includes an **Instant Demo Access** sidebar allowing you to auto-fill any of these credentials with a single click!

---

## 👑 Bootstrapping Your Real Production Account as Supreme Owner

To promote your real personal account to the singular **Supreme Owner**:

1. Register your personal account via the UI (`/register`) or API.
2. Run the secure CLI bootstrap script:
   ```bash
   node scripts/bootstrap-supreme.mjs your-email@domain.com
   ```
3. The script will safely promote your account to `SUPREME_OWNER`, grant verified status, assign the `supreme_dev` tier, and record an immutable entry in the audit trail.

---

## 🗄️ Database Migrations (PostgreSQL / Supabase)

All SQL DDL and RLS policies are located in `supabase/migrations/`:
- `00001_initial_schema.sql`: 44 tables, constraints, indexes, and relations.
- `00002_rls_policies.sql`: Declarative Row Level Security policies.
- `00003_seed_data.sql`: Seed data for development and initial community fixtures.

To apply to your Supabase project:
```bash
# Using Supabase CLI
supabase db push

# Or execute the SQL files in order inside the Supabase SQL Editor
```

---

## 📦 Production Build

```bash
# Typecheck
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm start
```
DevSphere builds with 100% clean TypeScript compilation across all 46 routes and API endpoints.

---

## 🔒 Security Architecture

- **Server-Side Authorization**: Every protected mutation and route verifies the caller's session token and role on the server.
- **Inviolable Supreme Tier**: No API endpoint can elevate any user to Supreme Owner.
- **Password Security**: Salted and hashed with `bcryptjs`.
- **Session Tokens**: HMAC-SHA256 signed JWTs stored in `HttpOnly`, `SameSite=Lax` cookies.
- **Audit Logging**: Privileged actions write unalterable audit entries with timestamp, actor, target, and rationale.

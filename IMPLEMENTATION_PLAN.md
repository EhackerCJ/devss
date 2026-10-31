# DevSphere Implementation Plan & Milestones

---

## Milestone Roadmap

### Milestone 1: Project Scaffold & Design System
- Setup Next.js 15+ App Router project with TypeScript, Tailwind CSS, Lucide icons, and modern tooling.
- Establish original design system tokens: dark mode first with polished light mode, custom theme palettes (Cyber, Emerald, Obsidian), typography, card layouts, dialogs, dropdowns, avatars, badges, and responsive containers.
- Setup mobile-first shell layout: responsive sidebar for desktop, bottom navigation bar + slide-over drawer for mobile.

### Milestone 2: Database Layer, Supabase SQL Migrations & Portable DAL
- Create full PostgreSQL / Supabase SQL schema migrations (`00001_initial_schema.sql`, `00002_rls_policies.sql`, `00003_seed_data.sql`).
- Implement the Data Access Layer (DAL) repository interfaces with dual-mode storage:
  - Supabase / PostgreSQL driver via standard connection strings.
  - Portable persistent JSON/SQLite storage engine for instant out-of-the-box local testing, CI, and development without requiring upfront external credentials.

### Milestone 3: Authentication & Account Lifecycle
- Implement user registration with unique username checks, password hashing via `bcryptjs`, and email format validation.
- Implement user login, session management via HttpOnly JWT cookies, and logout.
- Account state handling: active, restricted, suspended, banned.
- Session re-authentication middleware for high-security endpoints (Supreme Panel).
- Onboarding flow: profile avatar, banner, bio, and initial status setup.

### Milestone 4: Profiles, Social Graph & Presence
- User profile pages (`/profile/[username]`): display badges, stats, bio, mutual friends, follow status.
- Instagram-style Follow/Unfollow, private account follow requests (Approve, Reject, Cancel).
- Mutual Friends system: Send, Accept, Reject, Cancel, Unfriend, mutual friends calculation.
- Safety controls: Block, Unblock, Mute, Restrict.
- Real-time presence tracker (online, idle, dnd, offline) and last-seen privacy.

### Milestone 5: Direct Messaging & Real-Time Chat Engine
- 1-on-1 Direct Messaging (`/dms/[id]`).
- Real-time message streaming via Server-Sent Events (SSE) and Supabase Realtime broadcast.
- Message formatting: Markdown, code blocks with syntax highlighting and Copy button, emoji reactions, threaded replies, edit message, delete-for-self, delete-for-everyone.
- Typing indicators, unread message badges, and delivery states.

### Milestone 6: Group Chats & Community Servers
- Group chats: Create group, invite members, group roles (`GROUP_OWNER`, `GROUP_ADMIN`, `GROUP_MODERATOR`, `MEMBER`), pin messages, transfer ownership.
- Community servers: Create server, icon/banner, categories, channels (text, announcement, ai-help, projects).
- Server roles, custom roles, permission override engine, and invite links with max uses and expiration.

### Milestone 7: AI Coding Assistant
- Dedicated AI Studio (`/ai`) with multi-turn chat, prompt templates, and model selection.
- In-chat `@AI` bot invocation inside server channels and group chats.
- Secure server-side proxy to Google Gemini API with token quota accounting and rate limiting.
- Rich code rendering: syntax highlighting, language selector, line numbers, and one-click copy.

### Milestone 8: Premium Tiers & Contact-to-Purchase Workflow
- Dedicated `/premium` showcase page with tier comparisons (Free, Pro, Supreme Dev).
- "Contact Supreme / Request Premium" submission form (message + transaction reference).
- Request state machine: `pending` -> `contacted` -> `awaiting_verification` -> `approved` / `rejected`.
- Supreme / Admin manual verification dashboard to grant, extend, or revoke premium tiers.

### Milestone 9: Supreme Panel, Admin Panel & Moderator Panel
- Protected `/supreme` dashboard for Supreme Owner: platform analytics, user directory, staff delegation (Admin/Mod/Support), community oversight, feature flags, global limits, and immutable audit logs.
- Protected `/admin` panel: community oversight, report resolution, user timeout/ban, and premium management.
- Protected `/moderator` panel: report queues, content moderation, warnings, and slow-mode controls.

### Milestone 10: Notifications, Global Search & Discovery Directory
- Real-time notification center: friend requests, follow requests, mentions, replies, role changes, and system alerts.
- Global search bar: search users, public servers, and authorized messages.
- Public server discovery directory with categories and search tags.

### Milestone 11: File & Media Storage Engine
- Secure file upload handler with MIME validation, extension whitelisting, and quota enforcement.
- Avatar, banner, and chat attachment support with image preview modals and code file viewer.

### Milestone 12: Moderation, Reporting, Appeals & Audit Logging
- Reporting workflows for users, messages, servers, and groups.
- User appeals submission and review system.
- Immutable audit log recorder for all administrative and moderation events.

### Milestone 13: Seed Data & Supreme Bootstrap
- Development seed dataset with pre-configured accounts: Supreme Owner, Platform Admin, Platform Moderator, Support, Premium User, and standard users.
- Automated Supreme Owner bootstrap script via `SUPREME_OWNER_EMAIL`.

### Milestone 14: Automated Tests Suite
- Automated unit and integration tests covering authentication, permission matrices, social graph workflows, conversation security, and AI quota enforcement.
- Privilege escalation resistance tests.

### Milestone 15: Production Build & Deployment Readiness
- Typecheck (`tsc --noEmit`), lint check, and production build execution (`npm run build`).
- Deployment guides for Vercel, Supabase, and self-hosted environments.
- Comprehensive `FINAL_STATUS.md` report.

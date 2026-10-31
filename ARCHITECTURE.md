# DevSphere Architecture Specification
**Supreme Social + Community + Messaging + AI Coding Platform**

---

## 1. High-Level Vision & Identity
DevSphere is an original, mobile-first full-stack social communication and developer collaboration platform. It bridges the best interaction patterns of high-fidelity social networks (Instagram-style follow/social graph, rich profiles, activity status), modern community platforms (Discord/Slack-style servers, channels, roles, permission matrices), and real-time messaging (1-on-1 direct messages, group chats, typing, reactions, code snippets) with an integrated AI Coding Assistant and an administrative tier governed by a **Supreme Owner**.

---

## 2. System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    Client Tier                                        |
|   Next.js 15+ App Router, React 19/18, Tailwind CSS, Lucide Icons, Mobile-First PWA   |
|   (Desktop multi-column layout / Mobile bottom navigation & gesture drawers)          |
+---------------------------------------------------------------------------------------+
                                           |
                                  HTTPS / WSS / SSE
                                           |
+---------------------------------------------------------------------------------------+
|                                  API & Service Tier                                   |
|   Next.js Server Actions & Route Handlers (/api/*)                                    |
|   - Authentication & Session Verification (JOSE / HMAC / Bcrypt)                      |
|   - Granular Authorization & Permission Engine (Supreme, Admin, Mod, Server, Group)   |
|   - Input Validation (Zod Schemas) & Rate Limiting                                    |
|   - Real-time PubSub / Event Dispatcher (SSE + Supabase Realtime fallback)           |
|   - AI Coding Assistant Engine (Google Gemini API via Server-Side Proxy)              |
|   - Safe Storage & Upload Validator (MIME, Quota, Extension checks)                   |
|   - Audit Logging Engine (Immutable events for privileged actions)                    |
+---------------------------------------------------------------------------------------+
                                           |
+---------------------------------------------------------------------------------------+
|                                   Data Access Tier                                    |
|   Unified Repository / Data Access Layer (DAL)                                        |
|   - Native PostgreSQL / Supabase Client (RLS Policies, Triggers, Views)               |
|   - Portable Embedded Storage Engine (Local SQLite/JSON DB for zero-friction local/CI)|
+---------------------------------------------------------------------------------------+
                                           |
+---------------------------------------------------------------------------------------+
|                                     Storage Tier                                      |
|   - PostgreSQL (Supabase / Self-hosted) with full RLS migrations                      |
|   - File/Media Storage (Local safe upload directory / Supabase Storage S3-compatible) |
+---------------------------------------------------------------------------------------+
```

---

## 3. Technology Stack & Key Libraries

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | SSR/RSC for SEO and fast loading, API routes, Server Actions, modern React patterns |
| **Language** | TypeScript (Strict mode) | Type safety across client, server actions, API routes, and DB models |
| **Styling** | Tailwind CSS + CSS Modules | High performance, zero runtime overhead, rich theme support (Dark/Light/Accent) |
| **Icons** | Lucide React | Clean, consistent, lightweight SVG icon set |
| **Authentication**| Multi-strategy: Secure HTTP-Only Cookies (JWT/HMAC) + Supabase Auth Bridge | Complete control over session states, MFA re-auth for Supreme panel, password hashing with bcryptjs |
| **Database** | PostgreSQL / Supabase with local DAL fallback | Enterprise-grade relational schema, constraints, cascading, full SQL migrations |
| **Validation** | Zod | Runtime type validation for all incoming requests, forms, and server actions |
| **Realtime** | Server-Sent Events (SSE) / WebSockets + Supabase Realtime | Instant message delivery, typing indicators, presence, reactions, unread counts |
| **AI Integration** | Google Gemini API (official SDK / REST) | High-speed multi-turn coding assistance, syntax formatting, refactoring, context-aware explanations |
| **Syntax Highlighting** | PrismJS / Lowlight / Shiki | Visual code blocks with language indicators, line numbers, and copy-to-clipboard |

---

## 4. Key Subsystems & Interaction Flows

### 4.1 Supreme Owner & Platform Hierarchy
- **Supreme Owner (`SUPREME_OWNER`)**: Top-level platform authority with exclusive access to `/supreme`. Server-side enforced, requires strong re-authentication. Can delegate/revoke `PLATFORM_ADMIN`, `PLATFORM_MODERATOR`, and `SUPPORT`. Cannot be demoted or modified by delegated roles; cannot be created through standard APIs.
- **Platform Admin (`PLATFORM_ADMIN`)**: Platform-wide user management, community oversight, report resolution, and manual premium reviews.
- **Platform Moderator (`PLATFORM_MODERATOR`)**: Content moderation, warnings, timeouts, handling moderation queues.
- **Support (`SUPPORT`)**: User ticket and support requests.
- **Premium User (`PREMIUM_USER`)**: Subscribers with enhanced limits, badges, cosmetics, and priority AI quotas.
- **Standard User (`USER`)**: Base platform account.

### 4.2 Social Graph Subsystem
- **Instagram-Style Following**: Public or private accounts. For private accounts, follow actions generate a `follow_request` requiring approval/rejection. Followers can be removed.
- **Mutual Friends**: Bidirectional friend requests (Send, Accept, Reject, Cancel, Unfriend) with mutual friends count.
- **Safety**: Unilateral Block, Mute, and Restrict controls. Blocks prevent DMs, friend requests, and profile visibility.

### 4.3 Direct & Group Messaging
- **1-on-1 Direct Messages**: Real-time messaging with markdown, code snippets, attachments, emoji reactions, threaded replies, delivery & read receipts, typing indicators, and message editing/deletion.
- **Group Chats**: Multi-user conversations with custom names, icons, descriptions, roles (`GROUP_OWNER`, `GROUP_ADMIN`, `GROUP_MODERATOR`, `MEMBER`), permission management, and invite links.

### 4.4 Community Servers
- **Discord-style Server Architecture**: Server hierarchy, custom icons, banners, categories, and channels (Text, Announcement, AI-Help, Project Showcase).
- **Role & Permission Engine**: Server owner, admins, moderators, custom colored roles, and channel-specific permission overrides.
- **Safety & Moderation**: Server invite codes with expiry/max-uses, slow mode, audit logs, timeout, kick, and ban controls.

### 4.5 AI Coding Assistant
- Dedicated AI studio (`/ai`) and in-chat `@AI` bot invocation.
- Capabilities: Explain, debug, generate, refactor code, convert between languages, and project architecture advice.
- Server-side token tracking, daily user quota limits, and premium quota expansions.

### 4.6 Premium Accounts & Contact-to-Purchase Flow
- Free vs Premium tiers (Pro and Supreme Dev).
- "Contact Supreme / Request Premium" workflow where users submit requests with optional transaction reference.
- Status transitions: `pending` -> `contacted` -> `awaiting_verification` -> `approved` / `rejected`.
- Supreme / Admin manual verification and approval dashboard with transaction logs and audit trail.

---

## 5. Directory Structure
```
devsphere/
|-- src/
|   |-- app/                    # Next.js App Router pages & API routes
|   |   |-- (auth)/             # Auth routes (login, register, reset-password)
|   |   |-- (dashboard)/        # Main app shell (home, channels, dms, groups)
|   |   |-- supreme/            # Protected Supreme Panel
|   |   |-- admin/              # Platform Admin Panel
|   |   |-- moderator/          # Platform Moderator Panel
|   |   |-- ai/                 # AI Coding Studio
|   |   |-- premium/            # Premium plans & request workflow
|   |   |-- settings/           # Profile, privacy, security, appearance settings
|   |   |-- api/                # REST endpoints, SSE streams, webhook endpoints
|   |   `-- layout.tsx          # Root layout with theme and auth providers
|   |-- components/             # Reusable UI components
|   |   |-- ui/                 # Buttons, modals, inputs, badges, avatars, toasts
|   |   |-- chat/               # Message list, input, code block, reactions
|   |   |-- navigation/         # Sidebar, mobile bottom bar, header
|   |   |-- server/             # Server channels, members list, settings modal
|   |   |-- social/             # Followers, friend requests, profile cards
|   |   `-- supreme/            # Supreme dashboard widgets, user editor, audit logs
|   |-- lib/                    # Core utilities & services
|   |   |-- db/                 # Database clients, DAL repositories, SQLite/Postgres adapter
|   |   |-- auth/               # Session management, JWT, password hashing, guards
|   |   |-- permissions/        # Permission engine and matrix resolvers
|   |   |-- ai/                 # Gemini API client & prompt engineering
|   |   |-- realtime/           # Event emitter & SSE connection manager
|   |   |-- storage/            # File upload handler & MIME validator
|   |   `-- audit/              # Immutable audit logging service
|   `-- types/                  # TypeScript interface & type definitions
|-- supabase/
|   `-- migrations/             # Full PostgreSQL migrations & RLS policies
|-- tests/                      # Automated unit, integration, and security tests
|-- ARCHITECTURE.md             # This document
|-- IMPLEMENTATION_PLAN.md      # Milestones & execution phases
|-- PERMISSIONS.md              # Permission matrix & hierarchy rules
|-- DATABASE.md                 # Schema documentation & ERD
|-- SECURITY.md                 # Security architecture & threat model
`-- TODO.md                     # Living task tracker
```

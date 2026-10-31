# DevSphere Security & Threat Model Specification

---

## 1. Core Security Principles

1. **Defense in Depth**: Every protected transaction is authorized at multiple layers (HTTP middleware, Server Actions/Route Handlers, and Database Layer / RLS).
2. **Zero Client Trust**: Role checks in UI components are exclusively for user experience; no backend endpoint or mutation relies on client-provided assertions of identity or authority.
3. **Supreme Inviolability**: The Supreme Owner role cannot be assigned, assumed, or altered via standard mutations or compromised platform admin accounts.
4. **Least Privilege**: Standard platform staff (Admins, Moderators, Support) have strictly circumscribed permissions with zero access to private user DMs unless initiated through a formally reported moderation audit ticket.
5. **Immutable Accountability**: All privileged state transitions generate an unalterable audit log entry containing actor identity, target, timestamp, rationale, and diff.

---

## 2. Authentication & Session Security

- **Password Storage**: Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with a cost factor of 12.
- **Session Tokens**: JWT sessions signed with `JWT_SECRET` (HMAC-SHA256) stored in `HttpOnly`, `Secure` (in production), `SameSite=Lax` cookies.
- **Session Invalidation**: Sessions can be revoked instantly by incrementing the user's `session_version` or deleting active session records in the database.
- **Re-Authentication for Supreme & Admin Operations**: Sensitive operations (role delegation, platform bans, global configuration updates, emergency lockdown) verify that the user's active session has been authenticated or re-confirmed within the last 15 minutes.

---

## 3. Threat Matrix & Countermeasures

| Threat Vector | Attack Scenario | Countermeasure in DevSphere |
| :--- | :--- | :--- |
| **Privilege Escalation** | Attacker modifies user payload to set `platform_role: 'SUPREME_OWNER'` | Server validates roles against a protected enum; role assignment endpoints strictly require active `platform:manage_staff` permission; Supreme role cannot be delegated through API. |
| **Insecure Direct Object Reference (IDOR)** | Attacker queries `/api/conversations/[id]/messages` with an arbitrary ID | Server DAL explicitly joins `conversation_members` to ensure `member_id === current_user.id`. |
| **Cross-Site Scripting (XSS)** | Malicious user injects `<script>` or event handlers into markdown/chat | All markdown and code snippets sanitized using standard safe parsers; syntax highlighters do not evaluate code; React escapes all dynamic text bindings. |
| **Cross-Site Request Forgery (CSRF)** | Attacker tricks user's browser into submitting state-changing POST | All mutating Server Actions and API routes enforce strict JSON Content-Type, Origin/Referer headers, and SameSite cookie protection. |
| **Brute Force & Flooding** | Attacker spams login or registration endpoints | Sliding-window in-memory / cache rate limiter applied to `/api/auth/login`, `/api/auth/register`, and `/api/ai`. |
| **Malicious File Uploads** | Attacker uploads `.exe`, `.php`, or infected script disguised as `.png` | MIME type sniffing, strict file extension whitelist (images, audio, zip, json, txt, code files), size quotas enforced before disk write, and uploaded assets served with `Content-Disposition: attachment` or safe media sandbox headers. |
| **AI Quota Abuse** | User spams AI assistant with heavy prompts | Daily token accounting per user; Free users capped at daily threshold; rate limits on consecutive queries. |

---

## 4. Privacy Boundaries

- **Direct Messages**: Ordinary Platform Admins and Moderators cannot inspect direct messages or private group chats unless a specific message is flagged via the **Report Engine** for serious abuse.
- **No Password Recovery Inspection**: Even the Supreme Owner cannot view or reset passwords to cleartext; password resets generate time-limited cryptographic reset tokens.
- **IP Address Privacy**: Logged IP addresses are salted and hashed (`ip_hash`) to preserve forensic correlation without storing raw personal identifiable information indefinitely.

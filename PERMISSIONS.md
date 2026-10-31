# DevSphere Permissions & Hierarchy Specification

---

## 1. Role Hierarchies

DevSphere implements a strict, multi-tiered hierarchy with deterministic precedence across three distinct scopes:
1. **Platform Scope**
2. **Community Server Scope**
3. **Group Chat Scope**

Privileges NEVER leak between scopes. A Server Admin or Group Owner holds zero elevated platform authority.

```
                      +-------------------+
                      |   SUPREME OWNER   | (Platform Authority: Absolute, Sovereign)
                      +-------------------+
                                |
                      +-------------------+
                      |  PLATFORM ADMIN   | (Delegated Platform Governance)
                      +-------------------+
                                |
                      +-------------------+
                      |PLATFORM MODERATOR | (Content & Behavior Enforcement)
                      +-------------------+
                                |
                      +-------------------+
                      |      SUPPORT      | (Inquiries, Verification, Tickets)
                      +-------------------+
                                |
                      +-------------------+
                      |   PREMIUM USER    | (Cosmetic & Resource Perks Only)
                      +-------------------+
                                |
                      +-------------------+
                      |   STANDARD USER   | (Base Platform Member)
                      +-------------------+
```

---

## 2. Platform Permission Flags & Matrix

| Permission Flag | Description | SUPREME | ADMIN | MOD | SUPPORT | PREMIUM | USER |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `platform:supreme_access` | Access `/supreme` control center | **YES** | NO | NO | NO | NO | NO |
| `platform:manage_staff` | Delegate/revoke Admin, Mod, Support roles | **YES** | NO | NO | NO | NO | NO |
| `platform:system_config` | Modify global limits, maintenance mode, flags | **YES** | NO | NO | NO | NO | NO |
| `platform:audit_full` | View complete platform audit trail | **YES** | **YES** | NO | NO | NO | NO |
| `platform:manage_premium`| Approve, grant, extend, or revoke Premium tiers | **YES** | **YES** | NO | NO | NO | NO |
| `platform:ban_user` | Platform-wide user suspension and ban | **YES** | **YES** | NO | NO | NO | NO |
| `platform:warn_timeout` | Issue warnings or temporary timeouts to users | **YES** | **YES** | **YES** | NO | NO | NO |
| `platform:manage_reports`| Review and resolve platform moderation reports | **YES** | **YES** | **YES** | NO | NO | NO |
| `platform:view_reports` | View open user/server reports | **YES** | **YES** | **YES** | **YES**| NO | NO |
| `platform:support_tools` | Access support ticket queues and user lookups | **YES** | **YES** | **YES** | **YES**| NO | NO |
| `premium:extended_ai` | Higher daily AI token quotas and priority model | **YES** | **YES** | **YES** | NO | **YES** | NO |
| `premium:badge` | Special display badge & customized profile themes | **YES** | **YES** | **YES** | NO | **YES** | NO |
| `premium:higher_limits` | 100MB file uploads, up to 100 servers/groups | **YES** | **YES** | **YES** | NO | **YES** | NO |

---

## 3. Server Roles & Permissions

Within a Community Server, roles determine access to channels, moderation tools, and member management.

```
SERVER_OWNER (Level 100) -> SERVER_ADMIN (Level 80) -> SERVER_MODERATOR (Level 60) -> Custom Roles (Level 10-50) -> MEMBER (Level 0)
```

| Server Permission Flag | Description | Minimum Role |
| :--- | :--- | :--- |
| `server:manage_server` | Change server name, icon, banner, description, discovery | SERVER_ADMIN |
| `server:manage_roles` | Create, edit, and assign roles below actor's highest role | SERVER_ADMIN |
| `server:manage_channels`| Create, delete, edit text/announcement/AI channels | SERVER_ADMIN |
| `server:view_audit_logs`| Inspect server-level audit events | SERVER_ADMIN |
| `server:kick_members` | Remove members from server | SERVER_MODERATOR |
| `server:ban_members` | Ban members from server | SERVER_ADMIN |
| `server:timeout_members`| Apply temporary slow-mode or mute to a member | SERVER_MODERATOR |
| `server:delete_messages`| Delete any message in server channels | SERVER_MODERATOR |
| `server:pin_messages` | Pin or unpin messages in channels | SERVER_MODERATOR |
| `server:create_invites` | Generate invite links with expiry and max uses | MEMBER |
| `server:send_messages` | Send messages and chat in channels | MEMBER |
| `server:attach_files` | Upload media and attachments in channels | MEMBER |
| `server:add_reactions` | React with emojis to messages | MEMBER |

---

## 4. Group Chat Roles & Permissions

```
GROUP_OWNER -> GROUP_ADMIN -> GROUP_MODERATOR -> MEMBER
```

- **GROUP_OWNER**: Sovereign over the group chat. Can transfer ownership explicitly to another member, rename group, set icon, delete group. Cannot be kicked.
- **GROUP_ADMIN**: Can invite eligible members, remove standard members, manage group description/rules, pin messages.
- **GROUP_MODERATOR**: Can delete offensive messages, pin messages, mute notifications.
- **MEMBER**: Can chat, upload attachments, react, and leave the group.

---

## 5. Supreme Protection & Sovereign Rules

1. **Immutability of Supreme Role**:
   - There is exactly ONE initial Supreme Owner account bootstrapped via environment configuration (`SUPREME_OWNER_EMAIL`).
   - No API endpoint, database seed script, or delegated admin can elevate any user to `SUPREME_OWNER`.
   - The Supreme Owner cannot be banned, timed out, demoted, or deleted by any platform admin or moderator.
2. **Strict Server-Side Validation**:
   - UI elements for Supreme controls are hidden from non-Supreme users, but the API and Server Actions rigorously re-verify `user.platform_role === 'SUPREME_OWNER'` on every privileged transaction.
   - Access to `/supreme` requires recent re-authentication (session auth token must have been issued or re-verified within the last 15 minutes, or prompt for password confirmation).
3. **Accountability & Audit Logging**:
   - Every action in the Supreme and Admin panels writes an immutable audit record:
     `{ id, actor_id, target_id, action_type, reason, metadata, timestamp, ip_hash }`
   - Even the Supreme Owner's actions are recorded for transparent audit trails.
4. **Deterministic Allow/Deny Resolution**:
   - Explicit `DENY` takes precedence over `ALLOW`.
   - Hierarchy Level Rule: An actor can never perform moderation actions (kick, ban, timeout, demote) on a target user whose role level is equal to or higher than the actor's level.

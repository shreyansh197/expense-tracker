<!--
  ARCHITECTURE_DIAGRAMS.md — Mermaid sequence diagrams for ExpenStream critical flows
  Owner: AI Engineering Team
  Audience: Engineers, security reviewers, AI agents, new contributors.
  Companion docs: ARCHITECTURE.md (narrative), AI_CONTEXT.md (rules),
                  IMPLEMENTATION_QUEUE.md (task references).
  Rule: Every critical flow labels the guard chain
        `requireAuth → requireWorkspaceMember → checkRateLimit`.
        Diagrams render in GitHub Markdown (Mermaid live preview supported).
-->

# ExpenStream — Architecture Diagrams

**Status:** Living document · **Version:** 1.0 · **Last reviewed:** 2026-07-23

Sequence diagrams for the six critical flows in ExpenStream. Complements the narrative in [ARCHITECTURE.md](ARCHITECTURE.md). Every diagram deliberately shows the guard chain used by every mutation route (`requireAuth → requireWorkspaceMember → checkRateLimit`), because a new engineer or AI agent should never need to guess the middleware order.

Notation:

- Server modules live in `src/lib/server/**` (see [ARCHITECTURE.md §11](ARCHITECTURE.md)).
- Client modules live in `src/lib/**` and `src/hooks/**`.
- Guards: `requireAuth` (in [`guards.ts`](../src/lib/server/)), `requireWorkspaceMember`, `checkRateLimit` ([`rateLimit.ts`](../src/lib/server/)).
- Postgres tables live behind Supabase RLS (migration [`012_enable_rls_all_tables.sql`](../prisma/migrations/012_enable_rls_all_tables.sql)).

---

## 1. Login → TOTP (2FA) challenge

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Client (React)
    participant MW as middleware.ts
    participant API as /api/auth/login
    participant T as tokens.ts
    participant P as password.ts
    participant DB as Postgres

    U->>C: submit email + password
    C->>MW: POST /api/auth/login (public route, passes through)
    MW->>API: forward
    API->>API: checkRateLimit(ip, "login")
    API->>DB: SELECT user by email
    DB-->>API: user row (hash, totp_enabled)
    API->>P: comparePassword(hash, input)
    P-->>API: ok
    alt totp_enabled = true
        API->>T: issueChallengeJWT(userId, sid)
        T-->>API: challenge JWT (5 min)
        API-->>C: 200 { step: "totp", challenge }
        C->>U: prompt for TOTP code
        U->>C: submit 6-digit code
        C->>API: POST /api/auth/totp/verify (Bearer: challenge)
        API->>DB: SELECT totp_secret WHERE user
        API->>API: verifyTOTP(secret, code)
        API->>T: issueAccessJWT + issueRefresh
        T-->>API: access (15 min) + refresh (30 d)
        API-->>C: 200 { access, wid, did } + Set-Cookie refresh
    else totp_enabled = false
        API->>T: issueAccessJWT + issueRefresh
        API-->>C: 200 { access, wid, did } + Set-Cookie refresh
    end
    C->>U: navigate to /dashboard
    Note over API,DB: audit_logs entry: login.success / login.totp.success
```

---

## 2. Device-link accept (multi-device continuity)

```mermaid
sequenceDiagram
    autonumber
    participant NewDev as New Device (browser B)
    participant OldDev as Trusted Device (browser A)
    participant API as /api/devices/*
    participant Guards as requireAuth → requireWorkspaceMember → checkRateLimit
    participant DB as Postgres

    OldDev->>API: POST /api/devices/link-init
    API->>Guards: authorise (A's session)
    Guards-->>API: { userId, sessionId, deviceId=A, workspaceId }
    API->>DB: INSERT device_link_request(code, expires_in=5min)
    DB-->>API: link code (6 digits)
    API-->>OldDev: 200 { code }
    OldDev->>NewDev: show/display code (out-of-band)

    NewDev->>API: POST /api/devices/link-accept { code, clientId }
    Note over API: public route: rate-limited by IP
    API->>API: checkRateLimit(ip, "link-accept")
    API->>DB: SELECT device_link_request WHERE code AND NOT expired
    DB-->>API: matched row
    API->>DB: INSERT device(user_id, workspace_id, client_id)
    API->>DB: DELETE device_link_request
    API->>API: issueAccessJWT + issueRefresh
    API-->>NewDev: 200 { access, wid, did=B } + Set-Cookie refresh
    Note over API,DB: audit_logs: device.link.accept (user_id, workspace_id, deviceId=B)
```

---

## 3. Sync pull (delta)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (syncEngine.ts)
    participant IDB as Dexie (IndexedDB)
    participant Guards as requireAuth → requireWorkspaceMember → checkRateLimit
    participant API as /api/sync/pull
    participant DB as Postgres

    C->>IDB: read lastPulledAt(workspaceId)
    IDB-->>C: cursor timestamp
    C->>API: GET /api/sync/pull?since=cursor (Bearer + x-workspace-id)
    API->>Guards: authorise + workspace-scope + rate-limit
    Guards-->>API: { userId, workspaceId }
    API->>DB: SELECT * FROM expenses,ledgers,payments,settings WHERE workspace_id AND updated_at > since
    Note right of DB: RLS enforced by workspace_id (migration 012)
    DB-->>API: delta rows (paged, cursor next)
    API-->>C: 200 { rows, nextCursor, serverNow }
    C->>IDB: bulkPut(rows) + write lastPulledAt = serverNow
    C-->>C: emit onSyncPull({ counts })
    Note over C: no PII/money in emitted counters
```

---

## 4. Mutation commit (write path with idempotency)

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Client (hooks + syncEngine.ts)
    participant IDB as Dexie mutation queue
    participant Guards as requireAuth → requireWorkspaceMember → checkRateLimit
    participant API as /api/sync/commit
    participant DB as Postgres

    U->>C: add expense (offline or online)
    C->>IDB: enqueue mutation { idempotencyKey, op, payload }
    IDB-->>C: queued
    C->>C: syncEngine drain (on connect / interval / visibility)

    loop until empty or terminal error
        C->>API: POST /api/sync/commit { idempotencyKey, op, payload }
        API->>Guards: authorise + workspace-scope + rate-limit
        Guards-->>API: { userId, workspaceId }
        API->>DB: SELECT WHERE workspace_id AND idempotency_key = ?
        alt already committed
            DB-->>API: existing row
            API-->>C: 200 { row, deduped: true }
        else new
            API->>DB: INSERT/UPDATE row (RLS enforced)
            API->>DB: INSERT audit_logs (op, workspace_id)
            DB-->>API: committed row
            API-->>C: 200 { row }
        end
        C->>IDB: mark mutation as delivered (or backoff on 5xx)
    end

    Note over C,API: Persistent queue + unique(workspace_id, idempotency_key) → Sprint 2.2 (T-2.2.*).
    Note over C: On 401 → onWorkspaceAccessDenied; on 409 → conflict resolver (Sprint 2.3).
```

---

## 5. Workspace invite accept

```mermaid
sequenceDiagram
    autonumber
    participant Owner as Owner (device A)
    participant Invitee as Invitee (device B)
    participant Email as Resend
    participant Guards as requireAuth → requireWorkspaceMember → checkRateLimit
    participant API as /api/workspace/invite*
    participant DB as Postgres

    Owner->>API: POST /api/workspace/invite { email, role }
    API->>Guards: authorise (owner) + workspace-scope + rate-limit
    Guards-->>API: { userId, workspaceId, role: "owner" }
    API->>DB: INSERT workspace_invitations(token, expires_in=7d)
    API->>Email: sendTransactional(inviteToken URL)
    Email-->>Invitee: email with signed invite URL
    Invitee->>API: GET /api/workspace/invite/preview?token (public)
    API->>API: checkRateLimit(ip, "invite-preview")
    API->>DB: SELECT invitation WHERE token AND NOT expired
    DB-->>API: workspace name, role, inviter
    API-->>Invitee: 200 preview (no PII beyond invited email)

    Invitee->>API: POST /api/workspace/invite/accept { token } (Bearer of Invitee's own session)
    API->>Guards: authorise (invitee)
    Guards-->>API: { userId=invitee, workspaceId=null }
    API->>DB: INSERT workspace_members(user_id, workspace_id, role)
    API->>DB: DELETE workspace_invitations WHERE token
    API->>DB: INSERT audit_logs(workspace.invite.accept, inviter, invitee)
    API-->>Invitee: 200 { workspaceId }
    Invitee->>Invitee: switch to new workspace, trigger /api/sync/pull
```

---

## 6. Web Push send (server-scheduled)

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Vercel cron
    participant Route as /api/push/send
    participant Guards as (cron key) → checkRateLimit
    participant DB as Postgres
    participant WP as web-push (VAPID)
    participant Dev as User device (SW)

    Cron->>Route: POST /api/push/send (X-Cron-Key)
    Route->>Guards: verifyCronKey + checkRateLimit(cron)
    Guards-->>Route: authorised as cron
    Route->>DB: SELECT push_subscriptions JOIN notification_prefs WHERE quiet_hours=false AND due
    DB-->>Route: subscriptions batch
    loop for each subscription
        Route->>WP: sendNotification(sub, payload)
        alt 201 Created
            WP-->>Route: ok
        else 410 Gone / 404 Not Found
            Route->>DB: DELETE push_subscriptions WHERE endpoint=?
        else other error
            Route->>Route: syncErr → Sentry (no PII)
        end
    end
    Route-->>Cron: 200 { sent, pruned }

    WP-->>Dev: push event
    Dev->>Dev: SW showNotification (title only; no monetary values in body)
    Dev->>Dev: on click → open app / relevant route
    Note over Dev: quiet-hours enforced client-side too (Sprint 3.2 hardens tz correctness).
```

---

## Notes

- Diagrams use **Mermaid** and render natively in GitHub Markdown preview and VS Code.
- Every mutation route must, in order: `requireAuth → requireWorkspaceMember → checkRateLimit → Zod validate → handler → Prisma`. See [ARCHITECTURE.md §4.1](ARCHITECTURE.md).
- Public routes (login, invite preview, VAPID key, cron push) **skip `requireAuth`** but must still call `checkRateLimit`.
- `audit_logs` writes are documented per-flow. See [`audit.ts`](../src/lib/server/) for the schema (event, actor, workspace, ip_hash).
- Diagrams intentionally omit monetary values, remarks, and email content — see the "no PII / no money in observability" rule in [AI_CONTEXT.md §18](AI_CONTEXT.md).

**Last reviewed:** 2026-07-23

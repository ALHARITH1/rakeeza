# ركيزة - النسخة المتصلة المحدودة

This is the source for a separate connected pilot. Existing demo at https://alharith1.github.io/rakeeza/ remains unchanged.

The connected pilot enables company self-registration and company executive accounts with shared Postgres data. All eleven other roles, role invitations and the public attendance kiosk remain demo-only. No SMS ownership verification or self-service password recovery is enabled. Do not use sensitive operational data before a further security review.

Saves run after edits, with a visible server confirmation. Refresh from the server manually to see another device's edits. A stale write is rejected, and an unsaved JSON copy can be downloaded before loading the latest data.

Build: `npm ci && npm run lint && npm run build`. Deploy `dist` only. The public publishable key is intended for browsers. Database passwords and service-role secrets must never be placed here.

`backend/001_online.sql` installs a new schema once. Private tables have no anonymous access. Only narrow RPCs are exposed. Tokens are hashed server-side, passwords use bcrypt, and every save validates the session, role, company and revision. The last 50 database versions are kept inside the same database; this is not a disaster-recovery backup. The free Supabase plan may pause inactive projects and does not include automatic backups.

Tests: `backend/security-tests.sql` rolls back its fixtures. Local browser adapters and scripts under `backend` are development tools, not deployed endpoints. See `backend/PROGRESS.md`.

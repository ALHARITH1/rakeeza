# Full-role implementation plan

Do not apply or publish v2 until adversarial tests pass. v1 remains online.

Server owns account role, project memberships, worker/subcontractor/supplier binding, effective actions and workflow transitions. Scope reads before data reaches a browser. Do not make non-executive clients submit a whole tenant snapshot. Each mutation is an action RPC with a typed payload. Server validates permission, scope, current status, allowed fields, numeric bounds and references, then computes derived effects. Generate audit actor and notifications server-side. Lock tenant row and preserve expected revision before writing. Existing v1 save must be replaced with the same invariant enforcement before enabling multi-role access.

Phases:
1. Account management, explicit invite acceptance, effective permissions and scoped read RPC. Do not release read access until salary/finance and external-party redaction tests pass.
2. Project/BOQ and site actions, DPR/PTW/quantity posting.
3. PPC/VO/RFI/MR workflows with role-specific transitions, cumulative checks and financial recomputation.
4. HR/worker, own-record leave/advance/TBT, supplier/subcontractor boundaries.
5. Authenticated attendance: calculate geofence on server from coordinates/accuracy and assigned project, never trust client inside/outside boolean. Browser geolocation is not proof against a malicious GPS source; label it accurately. No public identity-number-only tenant lookup.
6. Recovery: owner-generated one-time recovery code, stored hashed, shown once. No fake SMS/email delivery claims. Determine whether self-held recovery key satisfies the requested recovery outcome before final presentation; email reset requires verified email and a sending route. Owner may reset member credentials, but recovery of executive requires actual recovery proof.
7. Backup/restore: tenant export includes source version and integrity metadata, optionally encrypted client-side with a user-held key; owner-only restore is a new audited revision, not destructive historical replacement. Local export is not automatic offsite backup. Free provider plan has no managed automatic backup. Document and test a supported restore drill.
8. Re-run each positive role workflow and cross-role/cross-project/cross-tenant negative tests on real backend; publish only passed roles and retain demo separately.

Current risks: v1 owner can intentionally replace entire business dataset; that must not bypass approval state when other roles are enabled. No setting that grants a tab can imply financial read permission. No employee may set their own role, active status, worker/supplier binding or project scope. Disabling an account invalidates existing sessions. Revision conflicts must never silently discard an in-progress form.

2026-10-31 21:42 checkpoint: private staged SQL compiles locally; scope/invite/recovery/DPR/PPC/MR/VO/RFI/subclaim/NCR/HR/attendance/backup/adversarial tests pass locally. V2 browser registers executive, creates project by command, invites and signs in site engineer. All 12 role UIs and their tabs rendered against scoped realistic seed fixtures with zero page exceptions. Test cleanup needs session deletion before account deletion (fixed). No v2 migration, auth route or frontend has been deployed. Need real-backend activation and full UI action coverage, plus remaining details below.

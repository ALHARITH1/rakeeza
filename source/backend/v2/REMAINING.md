# Connected release scope

All 12 roles (executive plus 11 other roles) have scoped server reads and reviewed command boundaries. Test evidence dated 2026-10-31.

Verified:
- Six SQL suites on real backend: role/project/HR boundaries; invite one-time use; self-held recovery; workflow ordering and quantity/financial totals; cross-project and privilege escalation denials; attendance geofence and duplicate/order; signed same-company backup restore/tamper rejection; stale revision conflict; draft update lock and bounded JPEG images.
- All roles and allowed tabs render against scoped realistic fixtures on real backend.
- Independent browser DPR PM/consultant approval; PPC consultant/owner/executive recording; MR PM/procurement/supplier/GRN chains and safety TBT creation on real backend through private test transport before public activation.
- Browser registration, project creation, invite acceptance, recovery/login, backup download/restore and worker GPS far rejection/inside check-in/check-out locally.

Known limits and excluded units:
- No SMS or phone ownership check. Recovery is a self-held one-time key. Losing executive password AND recovery key has no automatic recovery path.
- Browser GPS can be spoofed. Server checks distance, accuracy and timestamp, not authenticity of a device sensor. Manual attendance is marked manual.
- Not real-time push sync: refresh to fetch another device's changes; revisions prevent stale overwrites. Pending failed commands can be downloaded. A server-confirmed command reloads the business view, so finish one form before starting another.
- Approvals and payment statuses are records only, not actual money transfers, government filings or external messages.
- Manual signed tenant export/restore only. No automatic offsite disaster recovery. A signed export needs this same database's signing key; it cannot restore an entirely lost provider project by itself.
- Free provider usage/storage limits and possible inactivity pauses apply. No uptime or production-security certification.
- Document archive/downloads, CRM contacts, live workforce map/journey, training certificates/skill matrix, handover certificates, WPS/payroll export and legal final settlement remain excluded, not ready and not silently simulated. TBT creation and employee signing are available separately.
- Equipment records can be read where authorized but creation/maintenance controls are not implemented.
- All native browser/UI workflows not explicitly named above are SQL-tested and render-tested only. This is a connected pilot, not a complete production acceptance of every module.

Post-publication verification at 22:05 Riyadh: actual public API tested all 11 nonexecutive invitations plus executive registration, role grants, worker/subcontractor bindings, one-use invitation tokens and invalid sessions. Actual hosted UI tested invite acceptance, key recovery, backup download/restore. Actual two-browser test rejected stale revision, downloaded pending commands, reloaded latest data, and confirmed only one project persisted. Actual public two-company test denied foreign project use and returned only token-owner's company even when a foreign company selector was supplied. Final fixture cleanup: zero accounts and zero companies. Legacy online entry redirects to online2; original demo tree hashes unchanged.

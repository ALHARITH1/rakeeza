# Connected pilot checkpoint, 2026-10-31

Connected pilot published at https://alharith1.github.io/rakeeza/online/ and verified from the published URL. Existing https://alharith1.github.io/rakeeza/ demo remains unchanged.

Prepared: private Postgres schema; bcrypt passwords; random hashed bearer sessions; company self-registration; executive-only online authority; separate online app and local demo; versioned saves with conflict rejection; explicit manual refresh to avoid erasing an in-progress form on another device; explicit saved/pending/error indicators; unsupported role invitations, role editor and public attendance disabled online. Online data never imported from the browser demo or persisted into its registry.

Local verification: TypeScript and production build pass. Disposable Postgres 14 schema compiles. SQL tests cover company isolation, session expiry/revocation/disabled status, server-side role checks, cross-company and missing-company writes, stale versions, bcrypt, rate limiting, version snapshots and table grants. Browser tests cover two isolated browser contexts, company registration/login, creating a project on one device, saving to database, refreshing on second device, persistence after reload and absence of local account/database keys. Leaflet transition bug corrected. Two-device conflict test passed locally: stale write blocked, unsaved JSON backup downloaded, newest state recovered. All eleven unsupported roles are denied read and write in SQL tests. Desktop/mobile screenshots inspected.

Live verification: schema installed on Supabase; SQL tests passed; live browser two-session flow and conflict recovery passed; anon Data API tests passed for company isolation, direct private table denial, forged/revoked tokens, missing registration fields and null revision rejection.

Publication checks complete: source and build scanned for secret indicators; original demo root entries verified byte-identical; source and online build added separately; desktop/mobile published pixels inspected; two-context registration, project creation, refresh persistence and conflict recovery passed on the published URL; test accounts and companies removed and count verified zero. All non-executive roles remain demo-only. Self-service recovery/SMS verification not implemented. No automatic disaster-recovery backups on free plan. Not suitable for sensitive operational data until additional review.

## 2026-10-31 multi-role connected pilot

Staged separate frontend under online2; original demo and executive pilot files preserved. Private migrations 001-009 installed on actual free Supabase and six SQL suites pass. Actual account fixtures removed after tests. Prior legacy whole-snapshot save must be disabled by 010 before public multi-role login opens.

Reviewed scope and exclusions are in v2/REMAINING.md. This is not acceptance of all original demo units. Excluded units cannot impersonate actual documents, government actions, legal settlement, bank payments or live tracking. Browser GPS is not tamperproof and user-held recovery is not SMS.

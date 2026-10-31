# Release checklist

No v2 code is deployed yet. SQL helpers are private, no grants. v1 remains untouched.

Before activation:
- Run local and real-backend tests for every role, scope, forged references, workflow ordering and duplicate posts.
- Invalidate legacy full-snapshot writes. Keep read/login compatibility only where it cannot bypass v2 policy.
- Reject arbitrary record IDs on creates, computed totals/histories/actors, duplicate lines and cross-project references.
- Ensure every frontend mutation routes to a command, never silently falls back to a local write.
- Test account disable and password reset against existing sessions; owner cannot disable self.
- Test worker GPS permission denial, stale location, low accuracy, far location, duplicate attendance and checkout ordering. Browser location may be spoofed; do not call it tamper-proof.
- Recovery codes are user-held credentials, not verified SMS. Do not show or send them to anyone except the authenticated account holder in the platform. Test one-time recovery and key rotation.
- Backups are sensitive private downloads, signed for same-company restoration; accounts and current permissions are not rewound. This does not replace full database disaster-recovery backups or recover lost hosting accounts. Test download/restore/tamper/wrong-company.
- Review screenshots and keyboard/mobile forms. Do not put active invite/recovery secrets into screenshots shared outside the task.

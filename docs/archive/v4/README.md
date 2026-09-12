# BibleQuest V4 Archive

Status: **PRODUCTION RELEASE COMPLETE / FROZEN**

## Exact release backups

- exact promoted application candidate: `archive/v4.0-rc3-app-20260913`
  - SHA `7de1c53ddd33c028498b35bee77be30e56878dec`
- exact production merge verified by Cloudflare: `archive/v4.0-production-20260913`
  - SHA `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- accepted production documentation state: `archive/v4.0-production-accepted-20260913`
  - SHA `74db0239ab0aec4cf111da9a1579c0e561f8f106`

Canonical backup authority remains `/BACKUP_MANIFEST.md`.

## Production identity

- release: V4 RC3
- promotion PR: #179
- authoritative Cloudflare project: `mybiblequest`
- canonical host: `https://mybiblequest.pages.dev`
- post-main production smoke: run `34720411662` — PASS

The production smoke verified exact-SHA deployment identity, host readiness, critical/deep route and state behavior, PWA/offline behavior, and recovery.

## Final V4 scope note

RC3 includes the Videos consolidation that merged the former Live Recordings and Media Library presentation into one Videos experience while preserving the single-player ownership model and server-side media curation authorization.

## Manual field-gate disposition

V4 Phase 6 manual Gates A-G were explicitly **OWNER-WAIVED** for this release. They are not PASS evidence and must never be described as executed field tests unless later genuinely performed and recorded.

## Historical V4 documents

Start with:

- `/V4_ACTIVE_STATUS.md` — final frozen V4 release and acceptance status.
- `/V4_DOCUMENTATION_AUTHORITY.md` — historical V4 authority model.
- `/V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — historical acceptance tracking.
- `/RELEASE_FIELD_VALIDATION_V4.md` — retained field procedures.
- `/V4_PHASE6_FIELD_EVIDENCE.json` — final machine-readable owner-waiver disposition.
- `/V4_RELEASE_OWNER_WAIVER.md` — explicit release decision.

The completed integration branch `v4/modern-ui-overhaul` and RC branches remain history, not V5 development baselines.

## Post-release cleanup debt retained intentionally

`src/app/media-library.js` and `src/features/media-library/index.js` remain as tested architectural files even though no live route currently owns them. Removal should happen only through a future reviewed cleanup that updates the architecture validator and regression contracts together; do not delete them merely for cosmetic tidiness.

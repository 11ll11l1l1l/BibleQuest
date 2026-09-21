# BibleQuest V5 production release — 2026-09-18

## Release

- Production PR: #449
- Production merge commit: `f6a0cff0e63ddf676b77b8470d84678958fe9d70`
- Certified runtime/source freeze: `c0772d458e9d17ab1728c47c568e99857c7d67a1`
- V5 acceptance: **122/122**
- V4 rollback: `rollback/v4-pre-v5-production-20260918`

## Post-merge verification

Both Cloudflare Pages projects deployed the production merge commit successfully:

- `mybiblequest`: SUCCESS on `f6a0cff`
- `biblequest`: SUCCESS on `f6a0cff`

The post-merge deployed preview smoke also completed successfully.

Before promotion, the production PR passed:

- full accumulated regression;
- whole-app audit;
- protected-pages browser matrix;
- Section H responsive/accessibility/PWA gate;
- Section I security/privacy gate;
- deployed preview smoke;
- field-evidence gate;
- Cloudflare preview deployment.

The only pre-merge CI correction was a stale V4 static Admin email-change assertion. It expected the superseded variable-form audit detail. The runtime correctly uses fail-closed session revocation and records `sessionsRevoked:true`; that real path had already passed the isolated Supabase BACKEND-E2E. Only the stale test expectation was updated.

## Scope reconciliation

The six commits previously unique to `main` were documentation-only. The V6/V7 planning updates were retained. The alternate stale main-only V5 Feature Flag / Runtime Configuration checklist was not imported into the certified V5 contract.

See `docs/v5/V5_MAIN_RELEASE_RECONCILIATION_2026-09-18.md` for the detailed reconciliation record.

## Result

BibleQuest V5 is released to production. V6 may now begin from this released V5 baseline after normal V6 Phase 0 preparation.

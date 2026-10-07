# V7 remaining acceptance closure — 2026-10-06

Started at `f6ee96cb8cc5e0316eb5cfa96f544a3dddb00a7d`; serialized work across shared workflow/schema/status ownership. Scope: close concrete backend and candidate-evidence gaps. No V8 implementation, production change, content approval, candidate freeze or physical evidence.

## Integrated content evidence

[PR #1253](https://github.com/11ll11l1l1l/BibleQuest/pull/1253) binds the existing content report to the exact selected source, includes content bundles/generator in build-gate triggers, preserves the report with checksums, and records representative content separately from runtime build success. Pending editorial/rights decisions remain OPEN; incomplete localization or candidate mismatch fails verification.

Validation: six affected content/readiness tests, YAML parsing, report generation and execution of the workflow's sealing code (OPEN preserved; mismatched candidate rejected). Pinned [build/browser/PWA run 37385946337](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37385946337) passed on `daab4e14551e9ba7a5653a0e3278dd4b4aac2024`; merged at `29df76cf2bb410cf2768daf8b39269f6ba3debf9`.

## Authenticated API defect and correction

[PR #1252](https://github.com/11ll11l1l1l/BibleQuest/pull/1252) adds real password sessions and authenticated Auth/Data API operations to the existing disposable database gate. The first run passed 675 pgTAP assertions but failed the real leader's invitation with HTTP 403. Seeded-row tests did not exercise `INSERT ... RETURNING`.

The participant-read policy queried the pair table through a STABLE helper while the new row's RETURNING visibility was evaluated. An append-only policy migration evaluates participant IDs directly on that row; existing invitation and lifecycle authority remains intact. Five new pgTAP assertions cover RETURNING acknowledgement, invited state, mentee visibility and same/foreign-congregation outsider denial.

The authenticated API journey covers real sign-in/user verification, mutual pair acceptance, seven-step authoring, atomic publication, immutable assignment and retry identity, role/tenant denial, persisted progress/resume/completion, mentor read-only behavior, private responses, explicit sharing/revocation, existing-session membership revocation, ended-pair denial and retained owner history. Loopback-only transport and bounded requests prevent production targeting. Bootstrap authority creates synthetic users/memberships only; feature operations use user JWTs. Evidence excludes tokens/passwords and response bodies. Disposable fixtures disappear with the CI runner.

Refreshed source: `aa579e7dba29583f49f59c6c020c32356e57296c`, including the merged content-evidence tree. Local syntax, 14 affected pair/database contract tests, append-only migration inventory and whitespace passed. The authenticated API step passed all nine checks; its original sanitized [JSON artifact](../../docs/v7/evidence/AUTHENTICATED_API_20261006.json) is preserved byte-for-byte from GitHub artifact `11379340943` (ZIP SHA-256 `bbd88c23082a6af2117c98c9837b5ad9b2dfa502fdf1afac4df16d42dca0298f`). Full executable results are recorded by [database run 37386422380](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37386422380) and [build/browser/PWA run 37386420130](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37386420130).

Both corrected-source runs passed: 680 current database assertions, nine authenticated API checks, 540 inherited V4-upgrade assertions and all 339 V7 unit/contract tests plus build/browser/PWA/accessibility/performance. PR #1252 merged at `be1664930bdaab47dff7f899ea6e6718edd50c87`; its tree `bdc91f164efa1904a74d4fbe5c9dd6dafcb028aa` equals the tested source tree. This establishes development verification, not exact-SHA release certification.

## Remaining acceptance boundary

- Genuine editorial approval/publication of the representative Books and Devotionals; verified exact-source rights plus editorial approval/publication of Past Teaching. [Content authority](../../docs/v7/P4_D_REPRESENTATIVE_CONTENT_READINESS.md) remains OPEN.
- Populated Library and authenticated author/mentor/mentee journeys through the built browser, including mobile/keyboard/locale/account-switch behavior. API evidence does not substitute for these observations.
- Serialized final candidate freeze, exact-candidate deployment/identity and applicable physical-device observations, then production promotion and post-production verification.

This work supplies development backend/API and runtime build evidence. It does not certify production or waive the remaining review/browser/device rows. `V7_ACTIVE_STATUS.md` remains the progress authority.

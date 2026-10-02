# V6 Exact-Candidate Field / Device Evidence

Status: PENDING
Evidence class: PHYSICAL-DEVICE
Candidate SHA: PENDING
Evidence date (JST): PENDING
Tester: PENDING

This is the canonical field/device evidence attachment for the V6 release candidate. Automated browser, unit, CI, and source evidence cannot substitute for observations requiring physical hardware.

Every PASS below must be observed against the same exact 40-character Candidate SHA. If the candidate changes, reset the observations and repeat the field run.

| Gate | Status | Device / OS / browser | Environment | Evidence reference | Observation |
|---|---|---|---|---|---|
| Manual accessibility: keyboard/focus | PENDING | PENDING | PENDING | PENDING | PENDING |
| Manual accessibility: screen reader | PENDING | PENDING | PENDING | PENDING | PENDING |
| Manual accessibility: text scaling/readability | PENDING | PENDING | PENDING | PENDING | PENDING |
| Manual accessibility: touch/mobile targets and overflow | PENDING | PENDING | PENDING | PENDING | PENDING |
| Manual accessibility: reduced motion/contrast | PENDING | PENDING | PENDING | PENDING | PENDING |
| Installed-PWA offline behavior | PENDING | PENDING | PENDING | PENDING | PENDING |
| Physical-device push delivery | PENDING | PENDING | PENDING | PENDING | PENDING |
| Background/lock-screen media controls where supported | PENDING | PENDING | PENDING | PENDING | PENDING |

The aggregate status may become PASS only when every applicable row is backed by a durable evidence reference against the exact Candidate SHA. Physical/manual accessibility remains separate from automated accessibility. The checklist field/device row must remain open until this record is PASS and its candidate SHA equals the release candidate being certified.

## Physical PWA + accessibility field harness

Use the unlinked deployed page `/v6-field-device.html` for the two Phase-N physical rows:

- `Physical installed-PWA offline acceptance passes.`
- `Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.`

The harness reads `bq-build.json` from the same deployed origin and refuses evidence export unless it contains an exact 40-character build SHA. Progress is stored under a candidate-SHA-scoped local key so a different build cannot silently inherit observations. A PASS export also requires a device/OS/browser label, environment, durable evidence reference, concrete observation text, and every required physical sub-check for that gate.

The harness does not update this canonical record or the release checklist automatically. Attach its sanitized JSON to a durable PR/issue/artifact record, transcribe the matching observations here against the same Candidate SHA, and only then promote the corresponding checklist row. Browser automation remains non-substitutable for these physical gates.


## Push backend production readiness

Evidence class: BACKEND — does not satisfy PHYSICAL-DEVICE gates.

Production activation observed 2026-10-02 JST after merged PR #1029:

- the live database contains the additive due-reminder schema, idempotency/indexes, and service-role-only enqueue RPC;
- `bq-assignment-reminders` version 1 is ACTIVE and requires the dedicated Vault-held scheduler token;
- `pg_cron` + `pg_net` are enabled and one active `bq-assignment-due-reminders-v6` job runs every five minutes;
- the first live Cron run at 2026-10-01 15:10:00 UTC succeeded;
- its HTTP response was 200 with `{"ok":true,"queued":0,"failed":0}`;
- a tokenless POST was rejected with HTTP 401 `Scheduler authorization required`;
- zero eligible recipients existed at activation and no due-notification rows were created.

This proves the scheduler/function/authentication path is live and fail-closed without generating a user notification. It does **not** prove P1/P2/P3 on physical hardware and does not close the combined assignment assigned/due row until a designated QA recipient safely exercises an eligible live due reminder and canonical push dispatch.

## Push certification binding

Status: PENDING

Use the separate unlinked deployed page '/v6-push-device-field.html' together with 'docs/v6/V6_PUSH_DEVICE_FIELD_RUNBOOK.md'. The existing '/v6-field-device.html' remains the canonical harness for installed-PWA and manual accessibility gates.

The physical push row must remain PENDING until P1 and P2 are observed on a physical device against the exact Candidate SHA. Live assignment assigned/due certification additionally requires P3 after the reviewed due-reminder scheduler path is active.

For the aggregate push row, retain both evidence classes on the same exact candidate:

- BUILT-BROWSER: exact-head V6 Phase 1 Build Gate evidence covering 'tests/v6/assignment-push-service-worker.test.ts', notification click/deep-link behavior, and built-artifact service-worker registration.
- PHYSICAL-DEVICE: the sanitized JSON exported by '/v6-push-device-field.html' after real P1/P2 observations, plus P3 when binding the live assigned/due path.

Before transcribing a push PASS into this record, validate the exported JSON against this record's exact Candidate SHA with 'scripts/v6-validate-push-field-evidence.mjs'. Retain the sanitized JSON as a durable issue/PR/artifact reference so the Markdown record is not the only evidence copy. A successful physical JSON validation never substitutes for the separate BUILT-BROWSER half of the aggregate push row.

Do not copy account identifiers, push endpoints, subscription keys, tokens, or server secrets into this record.

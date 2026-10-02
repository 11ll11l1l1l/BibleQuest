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

Before transcribing any non-push PASS, validate the exported JSON against the exact candidate:

```bash
node scripts/v6-validate-field-device-evidence.mjs field-device.json <exact-candidate-sha> installed-pwa
node scripts/v6-validate-field-device-evidence.mjs field-device.json <exact-candidate-sha> manual-accessibility
node scripts/v6-validate-field-device-evidence.mjs field-device.json <exact-candidate-sha> background-media
node scripts/v6-validate-field-device-evidence.mjs field-device.json <exact-candidate-sha> full-nonpush
```

Both physical harnesses share the same exact-SHA, metadata sanitization, sensitive-value rejection, timestamp, and physical sub-step validation contract. The non-push harness refuses an installed-PWA PASS from normal browser-tab display mode. These validators verify evidence structure only; they never manufacture a physical observation or change PENDING to PASS.


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


## Consolidated final-RC human field package

Do not initialize this package until the release-candidate worker has selected the final exact 40-character RC SHA. Initializing the package does not mark any field row PASS.

Create the package skeleton:

```bash
node scripts/v6-field-certification-package.mjs init <exact-rc-sha> field-certification.json
```

Keep the two existing harness exports beside that file using the default names `field-device.json` and `field-push.json`, or edit only the relative paths under `artifacts`. The consolidated package deliberately reuses the existing `PWA-A11Y-MEDIA` and `PUSH` evidence formats rather than defining replacement physical evidence.

Before the human run, fill the package `references` only with durable, sanitized references. The required references are the exact-RC automated gate, the same-SHA built-browser push gate, the already accepted assignment-due backend/delivery evidence, the real assignment-assigned durable-notification evidence, the assignment-assigned canonical dispatch/ledger evidence, and the disposable-assignment cleanup record. Screenshot/video references are optional and must not contain private account or credential material.

### One bounded human session

1. **Exact candidate preflight.** Open the immutable candidate on the physical device. Confirm the harness-reported build SHA equals the final RC SHA. Record the deployed origin, device model, OS/browser/PWA environment, tester, timestamp and durable evidence reference. A different SHA invalidates the session.
2. **Installed PWA offline.** Install and launch the exact candidate in standalone mode, warm the service worker/content while online, confirm the exact build identity, disable networking, cold-launch the installed PWA, verify the offline shell and previously installed Reader content, verify network-only features do not report false success, fully close/relaunch while still offline, reconnect networking, verify recovery/synchronization, then export only after the harness shows networking restored.
3. **BSB background/lock-screen + manual accessibility.** Start verified Barry Hays BSB audio and note the active chapter/position. Background the app, lock the device, exercise play/pause, previous/next, seek and stop/dismiss where the platform exposes them, then return to BibleQuest and verify Reader/chapter/position coherence. Unsupported controls must be recorded as unavailable-but-safe, not invented. During the same audio session perform the bounded keyboard/focus, screen-reader, large-text/reflow, touch/overflow, reduced-motion/contrast and Reader-autoscroll/manual-navigation checks in `/v6-field-device.html`.
4. **Assignment-assigned + physical push.** In `/v6-push-device-field.html`, use a controlled QA recipient and a real authenticated Leader/Owner application session. For P1, enable assignment push, fully close BibleQuest, create one disposable assignment through the real `bq-assignment` path, confirm the durable assignment notification and canonical `assignment_assigned` dispatch/ledger record, observe a real OS notification, tap it and verify the exact candidate opens the correct Assignments destination with the durable Notification Center item. For P2, disable push, create the second disposable assignment, verify no OS push for at least 90 seconds while the durable in-app fallback remains, then archive/clean up only the disposable field records. Do not use a test-only authentication or privileged-send bypass.
5. **Due-path reuse.** Do not rerun P3 merely to repeat already accepted due-path scheduler/delivery evidence. Leave P3 PENDING when the final field package references the accepted due backend/delivery evidence. If that evidence is later rejected, missing, or no longer valid for the release environment, P3 must be executed using the canonical scheduler before the combined assignment assigned/due row can close.
6. **Export and validate.** Export the non-push and push JSON records, save them beside `field-certification.json`, fill only sanitized package references, and run:

```bash
node scripts/v6-field-certification-package.mjs validate field-certification.json <exact-rc-sha> field
```

The validator fails if either physical export belongs to another SHA, any mandatory physical step is absent, installed-PWA evidence was exported from a browser tab or before network recovery, P1/P2 are incomplete, supporting live/backend/browser references are missing, or a physical reference is represented only by headless/automation evidence.

A successful `field` profile is a machine-readable **ready-for-review** package. It does not edit this Markdown record or the acceptance checklist automatically.

## Final production human checklist

Keep this section unexecuted until the exact candidate has passed automated RC certification and the field package above is accepted for the same SHA. The initialized package already contains these ten post-production observations as PENDING:

1. automated RC gates are still PASS for the exact SHA;
2. all accepted field evidence is bound to that same SHA;
3. production promotion was authorized for exactly that SHA;
4. deployed production reports the exact build SHA;
5. production route smoke passes;
6. production PWA smoke passes;
7. production offline smoke passes;
8. a real production push smoke passes;
9. BSB audio startup/background-control smoke remains coherent;
10. post-production exact-SHA evidence is preserved durably.

After those observations genuinely occur, mark only the package observations actually seen as PASS with concrete notes, set the production-promotion and post-production evidence references, then run:

```bash
node scripts/v6-field-certification-package.mjs validate field-certification.json <exact-rc-sha> final
```

The `final` profile fails unless all ten post-production observations are real PASS records. CI/headless evidence cannot substitute for the physical records.

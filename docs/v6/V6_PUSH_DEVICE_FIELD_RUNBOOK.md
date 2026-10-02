# BibleQuest V6 — Web Push physical-device certification

Updated: 2026-10-01 JST

This runbook is the canonical procedure for the two open physical push acceptance requirements:

- Physical-device push acceptance passes.
- Push tests include browser/service-worker coverage plus physical-device acceptance.

It also supplies the physical half of the assignment assigned/due push closeout. Source, unit, browser and database tests remain necessary but cannot substitute for a physical device observation.

## Safety and exact-candidate boundary

- Use a designated safe BibleQuest QA account and a disposable assignment.
- Use one immutable Cloudflare preview produced from the exact V6 candidate SHA.
- Open '/v6-push-device-field.html' only on that exact preview.
- The harness must show matching 40-character Compiled SHA and Artifact SHA before testing.
- Use a physical Android device for the primary run. Record device model, Android version and browser/version without recording account identifiers.
- Never record passwords, private email addresses, Auth identifiers, push endpoints, subscription keys, VAPID private material, service keys or raw tokens.
- The harness has no privileged send capability. Server delivery must occur through the normal accepted BibleQuest assignment/push path.
- Keep all checklist rows open if any observation is missing, skipped, performed on another SHA, or inferred from automation.

## Automated/browser evidence required on the same SHA

Before field PASS, record a successful exact-head 'V6 Phase 1 Build Gate' run for the same candidate SHA. The run must include the V6 unit suite containing 'tests/v6/assignment-push-service-worker.test.ts' and the built-artifact browser/PWA checks.

Record:

- candidate SHA
- workflow run ID and URL/reference
- service-worker assignment assigned test PASS
- service-worker assignment due test PASS
- same-origin notification-click/deep-link test PASS
- built-artifact service-worker registration PASS

These are BUILT-BROWSER/automated evidence. They do not satisfy PHYSICAL-DEVICE evidence by themselves.

## P1 — assignment push enabled, app closed

1. On the exact preview, open '/v6-push-device-field.html'.
2. Confirm Candidate identity = exact SHA match.
3. Sign in with the designated QA account.
4. Tap Enable assignment push and grant browser/Android notification permission.
5. Tap Refresh status.
6. Required sanitized state:
   - harness=ready
   - signed in=yes
   - push supported=yes
   - permission=granted
   - service worker=active
   - browser subscription=present
   - owner marker=matches signed-in account
   - lifecycle persistence=verified by enable path
7. Fully close the installed PWA/browser so BibleQuest is not foregrounded.
8. Through the normal BibleQuest leader assignment flow, create one disposable assignment targeted to the QA member. Do not use a client-side or public privileged-send shortcut.
9. Confirm the backend created the durable assignment notification and the canonical sender attempted exactly the expected eligible subscription.
10. A real Android OS notification must arrive while the app/browser is closed.
11. Tap the OS notification.
12. Confirm the exact same preview origin opens the Assignments destination and the in-app Notification Center retains the durable item.

P1 is PHYSICAL-DEVICE PASS only when steps 1–12 are observed and a durable sanitized evidence reference is retained.

## P2 — push disabled preserves Notification Center behavior

1. Return to the same exact candidate harness.
2. Tap Disable push and Refresh status.
3. Required state: browser subscription=absent and owner marker=not matched.
4. Fully close the app/browser again.
5. Create a second disposable assignment for the same QA member through the normal assignment flow.
6. Confirm the durable in-app assignment notification is created.
7. Confirm the canonical sender has zero eligible current-browser deliveries for the disabled device.
8. Observe the phone for at least 90 seconds. No Android OS notification may arrive.
9. Reopen BibleQuest and confirm the second item exists and is usable in Notification Center.

P2 is PASS only when both no-OS-push and durable in-app fallback are observed.

## P3 — live due-reminder delivery

Run P3 only after the reviewed assignment due-reminder migration, Edge Function, Vault configuration and Cron job are active on the same release environment.

1. Re-enable assignment push on the same QA device and confirm the P1 ready state.
2. Create a disposable assignment for the QA member with a valid due time and reminder time that will enter the scheduler window.
3. Fully close the app/browser.
4. Allow the configured five-minute scheduler cadence to execute; do not manually call the service-only reminder function as a substitute for scheduler evidence.
5. Confirm exactly one 'assignment_due' durable notification is created for the incomplete QA recipient.
6. Confirm the canonical push sender dispatches that notification.
7. Confirm a real OS notification arrives and opens Assignments.
8. Re-run/observe another scheduler interval and confirm no duplicate due notification is created.

P3 supplies live assigned/due evidence. It must remain pending while the production/staging due-reminder scheduler path is not deployed.

## Evidence binding

The physical push harness now records P1/P2/P3 sub-steps, verdicts and sanitized observations. Fill the tester/device/environment/durable-reference metadata on the exact candidate, then use **Copy physical evidence JSON** only after the real physical observations have been performed.

Save that JSON as a durable field artifact and validate it against the exact candidate before updating acceptance:

```bash
node scripts/v6-validate-push-field-evidence.mjs field-push.json <exact-candidate-sha> physical-push
node scripts/v6-validate-push-field-evidence.mjs field-push.json <exact-candidate-sha> assignment-due
# Final combined P1/P2/P3 physical record:
node scripts/v6-validate-push-field-evidence.mjs field-push.json <exact-candidate-sha> full
```

The validator fails closed on a different candidate SHA, missing P1/P2/P3 sub-steps, PASS with unchecked sub-steps, missing observation text, missing metadata, or obvious account/credential/endpoint/token material. A successful `physical-push` profile proves only the PHYSICAL-DEVICE half; the aggregate push row still requires the exact-head BUILT-BROWSER evidence described above.

Update 'docs/v6/V6_FIELD_DEVICE_EVIDENCE.md' only after the observations occur. For the push rows record:

- exact candidate SHA
- date/time in JST
- tester name/role
- physical device, OS and browser/version
- immutable preview host/reference
- sanitized P1/P2/P3 observations
- exact-head Phase 1 workflow run reference
- backend evidence reference for sender counters and durable Notification Center rows
- screenshot/video reference if retained, with secrets/account identifiers removed

The checklist row 'Physical-device push acceptance passes.' requires PHYSICAL-DEVICE evidence.

The checklist row 'Push tests include browser/service-worker coverage plus physical-device acceptance.' requires both BUILT-BROWSER and PHYSICAL-DEVICE evidence bound to the same exact candidate.

## Cleanup

- Delete or archive only the disposable assignments/notifications created for the field run.
- Do not delete unrelated subscriptions or user data.
- If the QA device should not remain subscribed, use Disable push before signing out.
- Keep the harness unlinked from normal BibleQuest navigation.

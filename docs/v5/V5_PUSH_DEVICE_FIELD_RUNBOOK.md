# BibleQuest V5 — Web Push DEVICE/FIELD runbook

Updated: 2026-09-18 JST

This runbook executes only the two remaining V5 physical-device Web Push gates. It does not authorize production by itself.

## Safety boundary

- Use a designated safe BibleQuest QA/test account.
- Use the exact V5 Cloudflare preview SHA and HTTPS host.
- Use a physical Android device; emulator/headless results do not count.
- Never record passwords, private email addresses, auth tokens, push endpoints, subscription keys, VAPID private material, or service keys.
- The browser receives only the VAPID public key.
- Automatic assignment-triggered production fanout stays OFF.
- The QA page is intentionally unlinked from normal navigation: `/v5-push-device-field.html`.

## Gate P1 — app closed + push enabled

1. Open the exact Cloudflare preview `/v5-push-device-field.html` on the physical Android device.
2. Sign in with the designated safe test account.
3. Tap **Enable assignment push** and grant Android/browser notification permission.
4. Tap **Refresh status**.
5. Required sanitized state: signed in=yes; push supported=yes; permission=granted; browser subscription=present; current-browser persisted row=present; assignment opt-in=enabled; owner marker=current account.
6. Fully close BibleQuest/browser/PWA.
7. The controlled release operator creates one disposable assignment notification for the same QA account and invokes the accepted `bq-push-delivery` sender once.
8. Expected sanitized sender result: attempted=1, delivered=1, removed=0, failed=0, skipped=0.
9. A real Android OS notification must appear while the app is closed.
10. Tap it. BibleQuest must open on the same candidate origin and land on the accepted Assignments destination.
11. The same item must remain available through the normal in-app Notification Center.

Gate P1 is PASS only when all server and physical-device observations above pass.

## Gate P2 — push disabled preserves pre-push behavior

1. Return to the same exact candidate QA page.
2. Tap **Disable push**, then **Refresh status**.
3. Required sanitized state: browser subscription=absent; current-browser persisted row=absent; assignment opt-in=not enabled.
4. Fully close BibleQuest/browser/PWA again.
5. The controlled release operator creates a second disposable in-app assignment notification and invokes `bq-push-delivery` once.
6. Expected sender result: attempted=0, delivered=0, removed=0, failed=0, skipped=0.
7. Observe the phone for at least 90 seconds. No Android OS push may arrive.
8. Reopen BibleQuest and verify the second item exists and is usable in the normal Notification Center.

Gate P2 is PASS only when both no-OS-push and normal in-app behavior are observed.

## Cleanup

- Delete disposable field-test notification rows when they are no longer needed.
- Do not delete unrelated subscriptions.
- If the QA device should not remain subscribed, use **Disable push** before signing out.
- Retain only sanitized device/browser metadata, candidate SHA/host, PASS/FAIL observations, sender counters, and sanitized screenshot/video references.

## Release boundary

Passing P1 and P2 advances formal acceptance from 119/122 to 121/122. The last item is exact-candidate certification/freeze and final promotion decision.

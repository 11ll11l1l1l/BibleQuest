# W4 field execution note

Physical/manual acceptance remains pending. Execute the canonical field evidence record only against one exact candidate SHA. Browser emulation is not physical-device evidence.

## Exact-candidate procedure

1. Record the exact V6 candidate commit SHA and confirm the tested installation/build resolves to that same SHA before observations begin.
2. Use the canonical V6 field/device evidence record already enforced by the repository; do not create an alternate evidence class or convert browser automation into a physical result.
3. On each supported physical device/browser under test, record device model, OS/browser version, install mode, viewport/orientation, observer, timestamp, and the exact candidate SHA.
4. Exercise the release-critical manual accessibility path: launch/install, keyboard or platform focus navigation where applicable, visible focus, 200%/large-text readability, touch-target reachability, reduced-motion behavior, screen-reader labels/announcements, offline/reopen behavior, and recovery after reconnect.
5. Record PASS/FAIL per observation with reproducible steps. Any missing observation, SHA mismatch, unsupported environment, or ambiguous result is FAIL-CLOSED/PENDING rather than PASS.
6. Attach evidence to the exact candidate record and only then reconcile the corresponding physical/manual checklist row. A later candidate SHA requires a new or explicitly revalidated record.

## Evidence boundary

Built Chromium, unit tests, screenshots from emulation, and source inspection may prepare the run but cannot satisfy PHYSICAL-DEVICE acceptance. Production/deployed claims also require their own evidence class and authorization.

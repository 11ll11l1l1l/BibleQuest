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

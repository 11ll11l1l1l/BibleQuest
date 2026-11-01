# V8 daily app-open practice reminders — 2026-11-01 JST

Continuation on `v8/integration-20261031`, starting from locally tree-equivalent remote candidate `9146f09820840e90c6164ef1de5181bc4e421d40`. All eleven distinct remote workflow names on that candidate are now PASS, including inherited regression and strict release convergence. This evidence applies to that candidate only; new reminder code requires fresh checks and is not deployed.

## Implemented

Optional daily reminder settings in Spiritual Practices: enable, HH:MM and explicit IANA time zone. Existing private device storage scopes schedules and dismissal by guest/account. Home displays a due reminder while mounted, checking every 30 seconds; dismiss for today and starting a due practice dismiss it for the selected-zone calendar day. Full date/time-zone formatting handles DST without assuming a 24-hour interval.

Reuses the existing Notification Settings master switch, reading-category preference and quiet-hour controls rather than adding a second set. Quiet hours use the device zone for the current app session; the saved schedule uses its chosen zone. Account switching cannot dismiss a reminder displayed for another owner. Disabled, unsupported storage, invalid time/zone and form errors are handled without claiming success. No private reflections or copied Scripture enter reminder state.

Scope is explicitly foreground/device-local: a reminder appears on Home when the app is open. No Notification permission request, service-worker alarm, push delivery, durable server notification or closed-app guarantee is implemented or claimed. Existing settings have no general daily-practice scheduler; closed-app delivery remains open rather than being simulated with an in-page timer. No production backend/provider writes or real-user notifications were sent.

## Validation

Aggregate local units 1,654/1,654 PASS: V6 880, V7 765, V8 media 9, plus existing 31-attempt ledger audit. New coverage includes per-day dismissal, default opt-out, reading/master gates, overnight/all-day quiet, account isolation/stale dismissals, invalid time zones, DST fallback and reminder form save/error behavior. Typecheck, build, existing lint/format policies, changed-file whitespace and affected inherited Home/Japanese contracts PASS on Node 24.22.1. Pinned release/browser/device acceptance for this change remains separate and open.

## Remaining

Closed-app push scheduler and device delivery evidence, reviewed practice translations, managed offline practice packages and optional cues remain open. This completes only the explicitly labeled app-open reminder slice. Broader V8 media/Ilocano/content/Couples/discovery scope stays in the canonical roadmap. No new release framework, schema, dependency or production promotion is introduced.

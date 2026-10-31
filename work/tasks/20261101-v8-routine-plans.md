# V8 personal routine reminder plans

Baseline: remote integration `0a2ab66a6625272c46dfca8eccecb44e25c63e17`, PR #1558. Single coding executor; no backend/schema/provider change.

## Implementation

The existing private app-open reminder supports chosen weekdays and one of all eleven fixed timed routines, including 10/15/20-minute morning options. A small canonical metadata catalog feeds setup/Home titles and route validation without eagerly importing guides/private notes. Full guide translations reuse its duration-title formatter. Custom-duration plans are excluded because no duration is encoded in a fixed routine ID.

Weekdays use the selected IANA-zone calendar date; quiet hours retain the existing device-zone behavior and shared master/reading-category controls. Dismissal preserves the chosen routine/days and remains once per scheduled-zone day. Legacy schedules without new fields retain daily timing with a short-Silencio setup target. Invalid stored day/routine fields disable the reminder rather than broadening it. Disabling works even after unchecking all days, retaining the last valid day selection.

Home displays the chosen routine and opens its existing setup route only after rechecking current owner/due state. Opening is not a timer start, completion or dismissal; the destination preserves an existing session. Changed plans update the reminder, and transient status failures can recover. Plans are device/account scoped; no answers, notes or reflection data enters the catalog/route. EN/TL/CEB routine, weekday and form labels are provided.

## Verification and limits

67/67 affected practice/Home checks PASS: catalog/template identity, canonical route denial, actual Home selection/stale-account/error recovery/localization, real form submission/owner denial, weekday-zone boundary, legacy/corrupt schedules, edit/dismiss/cancel plus inherited quiet-hours/DST/privacy/timer/journal behavior. Application typecheck, production build, existing lint/format, browser-script syntax and whitespace pass on Node 24.22.1. The existing built Library/practice browser flow now saves/reloads an off plan with selected routine and three weekdays; browser execution and fresh exact-head CI remain separate.

No closed-app alerts, background scheduler, OS permission request, push delivery or real-user notification is introduced or claimed. Physical phone/offline/audio acceptance and broader V8 scope remain open. Uses the existing reminder key; no second scheduling service.

# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after congregation Calendar owner edit/delete promotion.

## Current release truth

- current `main` / exact-green product SHA: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`
- current product release ref: `release/v3-calendar-owner-edit-delete-20260912`
- current accumulated verifier: run `34623059639` — **success** on exact synthetic merge candidate `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`
- current product PR: #102 — merged by fast-forwarding `main` to the exact green synthetic merge candidate
- parent exact-green product: Visual Phase B More-hub icons `046e2a85cafe10d722d03d467d3733eddfeb6e65`
- parent release ref: `release/v3-phase-b-more-icons-20260912`
- parent accumulated verifier: run `34618963635` — **success**
- prior Ministry Hub Calendar surface checkpoint: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`
- previous production rollback/reference remains `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

The repository HEAD immediately before this milestone was docs/bookkeeping merge `030bf819d239829b4dac60bb2c2e6956aefdbfa7`; the prior exact-green product remained `046e2a85...`. PR #102's accumulated workflow explicitly checked out synthetic merge SHA `7d28d7c...`, and `main` was then fast-forwarded to that same verified SHA. No unverified product promotion SHA was created.

## Deployment state

No Cloudflare deployment or independent live-host proof has yet been transferred to `7d28d7c...` in this status record.

The last recorded Cloudflare Pages provider checks are for parent exact-green product `046e2a85...`, where both configured projects (`mybiblequest` and `biblequest` / `biblequest-7th`) reported success. The last fully independent two-host production verifier remains run `34612873935` for an earlier cumulative release.

Provider deployment success, when observed, does not replace independent byte-for-byte/live-browser verification. Do not claim the current Calendar milestone is independently production-verified until separate evidence exists for the exact deployed SHA.

## Newly completed product work

### Congregation Calendar owner edit/delete

Exact-green `7d28d7c...` completes the previously confirmed congregation-event correction path:

- shared-event creator identity is preserved through Calendar normalization as `ownerId`;
- only the authenticated creator receives edit/delete controls on the stored base shared event;
- synthetic weekly recurrence occurrences remain presentation-only and do not expose mutation controls;
- the Calendar service fails closed for non-owner edit/delete attempts before calling the API;
- API update/delete are scoped by event `id`, creator `user_id`, and `congregation_id`;
- existing own-row Calendar RLS is reused; no new schema/RLS migration was required;
- edit/delete mutate the existing row rather than inserting replacements, so the existing congregation creation notification trigger remains creation-only;
- congregation state is reloaded from the server-authoritative source after successful mutation;
- personal Calendar storage/sync, Assignments ownership, Congregation Membership ownership, Notification Center, routes, scoring and visual layout remain unchanged.

Permanent coverage was extended in `scripts/validate-v3-calendar.mjs`, `tests/v3-calendar-edge.mjs`, and `tests/v3-calendar-smoke.mjs`. Run `34623059639` checked out exact SHA `7d28d7c...` and passed all accumulated architecture validators, all edge/security/static regressions, app boot, and the full browser/mobile suite. The Calendar 390 px browser regression passed owner edit, owner delete, non-owner read-only visibility, recurrence refresh, personal-row isolation, >=44 px add target and no horizontal overflow.

### Prior completed checkpoints retained

- Ministry Hub Calendar surface: exact-green `350cb1e...`, run `34616603649` success.
- Visual Phase B More semantic icons: exact-green `046e2a85...`, run `34618963635` success.

Do not repeat either milestone.

## Production Supabase state

Production project: `zkfmgezvzugchcwppreq`.

The existing release migrations remain **APPLIED + LIVE VERIFIED** and were not changed by PR #102:

- `20260911144939` — `assignment_response_presence`
- `20260911144950` — `calendar_events`
- `20260911145003` — `calendar_congregation_sharing`

Do not reapply them. PR #102 added no migration and made no production database mutation.

## Current blockers

No credible P0/P1 product, security, privacy or data-loss blocker is recorded by accumulated run `34623059639`. Do not describe the application as bug-free.

The Calendar owner edit/delete milestone is closed. Non-owner mutations fail closed in service regression coverage, the API retains owner/congregation scoping, and the existing RLS remains the final database authorization layer.

Independent production/live-host verification for exact product `7d28d7c...` is still separate release evidence and must not be inferred from GitHub regression success.

## Correct next route

Priority 1 remains coordinated functionality/correctness plus Visual Phase B quality.

1. preserve `7d28d7c...` and `release/v3-calendar-owner-edit-delete-20260912` as the current exact-green product checkpoint;
2. do not repeat completed Calendar owner edit/delete, Ministry Hub Calendar, or More-icon work;
3. refresh current repository/investigator evidence before the next write;
4. prefer a genuinely unfinished high-value functionality requirement only if repository/user evidence shows it is required for release and its ownership/acceptance can be bounded cleanly;
5. fixed-weekly congregation recurrence is complete; custom non-weekly recurrence remains explicitly deferred and must not be promoted into release scope without evidence that it is required;
6. otherwise continue Visual Phase B on another materially minimal/placeholder/emoji-like surface, with real committed assets and without changing routes, feature ownership, scoring, storage or backend contracts;
7. run focused checks plus the complete accumulated exact-candidate suite for every product change;
8. keep deployment-provider evidence and independent production/live-host verification separate from GitHub regression evidence.

## Defect / root-cause ledger

- **Status-contract regression — closed.** PR #98 restored the validator-owned canonical headings; run `34616114505` passed completely.
- **Invalid push-trigger hardening attempt — rejected/closed.** PR #99 attempted a `push` trigger; permanent workflow contract rejected it and it was not merged.
- **Ministry Hub Calendar surface — completed.** Exact-green `350cb1e...`; run `34616603649` success.
- **Visual Phase B More semantic icons — completed.** Exact-green `046e2a85...`; run `34618963635` success.
- **Calendar owner edit/delete — completed.** Exact-green `7d28d7c...`; run `34623059639` success; frozen release ref created and `main` fast-forwarded to the exact tested synthetic merge candidate.
- **API full-file write syntax slip — contained before gate.** While adding the two Calendar API mutation methods on the isolated branch, a repository full-file write removed one closing brace from an unrelated password-reset call. The next diff inspection detected it before PR/test claims; corrective commit `daf77b48876b0aaf3c1073a024fb510edc948c39` changed only that character, and the final PR net API patch contains only the intended Calendar methods.
- No reproduced P0/P1 product defect is currently open in this ledger. New findings must be reproduced and priority-classified before modification.

## Next major milestone

Investigate the next materially under-designed Visual Phase B surface from current exact-green `7d28d7c...`, while first checking current repository evidence for any newly reproduced release-blocking functionality/correctness issue. Do not invent feature work merely because custom recurrence or other optional Calendar expansion is possible. If no P0/P1 functionality gap is reproduced, select the smallest user-facing surface whose current presentation is still materially placeholder, generic or emoji-like, implement real committed artwork under `VISUAL_PHASE_B_V3.md`, preserve existing interaction ownership, and require a new exact-SHA accumulated regression before promotion.

## Evidence rules

Repository evidence overrides stale prose. Docs-only HEAD != product SHA. Never transfer PASS across changed product SHAs. Never claim unexecuted tests. GitHub promotion != independent live-host proof. Cloudflare deployment-check success != byte-for-byte/browser production verification. A committed migration != an applied migration unless production evidence proves it. Do not call the application bug-free.
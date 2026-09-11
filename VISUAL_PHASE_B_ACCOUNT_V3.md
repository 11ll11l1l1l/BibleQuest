# BibleQuest v3 — Visual Phase B Account

Status: candidate milestone; not promoted until exact synthetic merge candidate passes the complete accumulated regression.

## Scope

Upgrade the existing v3 Account surface with committed same-origin semantic artwork while preserving all current account behavior and security wording.

This milestone is presentation-only. It does not create a new profile system, recovery mechanism, device model, authentication path or cloud-progress behavior.

## Ownership boundaries

- `src/app/account.js` continues to own account input validation, signup/recovery transactions and remembered-device behavior.
- `src/app/session.js` continues to own authentication/session state and password/session actions.
- `src/core/api.js` remains the single browser backend/Supabase boundary.
- `src/features/account/index.js` owns Account page rendering and callback wiring only.
- `src/ui/account-visual-polish.css` remains the earlier Phase A account polish layer.
- `src/ui/account-phase-b.css` is a presentation-only Phase B layer loaded after Phase A.
- `assets/account-feature-icons.svg` contains passive same-origin decorative artwork only.

No persistence, schema, RLS, Edge Function, route-owner or API contract change is authorized by this milestone.

## Artwork contract

The committed sprite must provide distinct symbols for:

- `profile`
- `sign-in`
- `create-account`
- `recovery`
- `device`
- `security`

All page artwork is decorative and must be `aria-hidden="true"`. Security meaning must remain available in visible text; artwork never replaces recovery-code warnings, password labels, device labels or confirmation steps.

The mapped historical PNG family under `assets/icons/v3/` is not present in the current tree, so this milestone deliberately adds a replacement SVG sprite rather than wiring nonexistent files.

## Interaction contract

Every existing Account action and route callback must remain intact, including:

- Sign in / Create account / Recover tab switching;
- Continue as guest;
- login, signup and recovery submissions;
- one-time recovery-code display, copy, saved acknowledgement and Continue gate;
- remembered-device listing and removal;
- recovery-code regeneration;
- password change;
- Return home;
- Sign out on this device;
- tutorial handoff after account creation.

Do not convert security actions to icon-only controls. Keep existing text labels and touch targets.

## Acceptance

Permanent focused verification must prove at minimum:

- all six sprite symbols exist and load from the same origin;
- guest Login, Create account and Recover states render distinct appropriate artwork;
- signed-in Account renders profile, device and security artwork;
- artwork is hidden from assistive technology while visible text remains present;
- existing Account behavior callbacks remain intact;
- relevant controls remain at least 44 px high on the 390 px mobile acceptance viewport;
- the Account surface introduces no horizontal overflow, console errors or page errors;
- existing `tests/v3-account-edge.mjs` remains in the accumulated regression.

## Evidence rule

No PASS transfers. The feature branch is not a release candidate merely because focused/static checks pass. Promotion requires the exact PR synthetic merge commit to pass the complete accumulated `v3-regression.yml` suite. Freeze that exact green candidate before advancing `main`.

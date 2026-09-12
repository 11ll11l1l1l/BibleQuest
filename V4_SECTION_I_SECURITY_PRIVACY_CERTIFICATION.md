# BibleQuest V4 Section I security/privacy certification

## Status

Section I automated security, privacy, data-integrity, and multi-account isolation gates are certified from exact tested candidate `9f8c530668b2d9cbaa0cca226750fe9278f0a24f`.

The tested candidate is preserved at `release/v4-section-i`. It was merged into `v4/modern-ui-overhaul` by PR #149 as merge commit `87ffdf439f21438afe8402b0c6502c276cd0dc37`.

Verification-only PR #150 was closed without merge after the accumulated regression passed.

## Exact evidence

- Full accumulated build/architecture/security/edge/browser-mobile regression `34693803229`: PASS.
- Dedicated Section I security/privacy workflow `34693803309`: PASS.
- Duplicate exact-SHA Section I run `34693802673`: PASS.
- Section H release gates `34693803249`: PASS.
- Whole-app browser audit `34693803222`: PASS.
- Protected-page audit `34693802698`: PASS.

All evidence above ran against exact candidate `9f8c530668b2d9cbaa0cca226750fe9278f0a24f`.

## Security/privacy gates closed

Repository evidence verifies that V4 preserves authentication and RLS boundaries, keeps canonical state/API ownership, introduces no browser-side service-role or privileged database shortcut, and maintains account isolation for Assignments, Journey Groups, Team Center, Couples, and Live Rooms.

The dedicated Section I matrix switches authenticated identities inside the same long-lived client service instance so stale prior-account state cannot be hidden by a full page reload. Existing feature edge tests remain part of the gate.

## Real defects found and fixed

1. **Assignments** could retain the previous account's in-memory assignment context when switching users, especially when both accounts belonged to the same congregation. That could preserve private leader-review responses or publisher-directory targets until a later successful reload. Account changes now invalidate and clear account-scoped state before asynchronous reload work starts.
2. **Journey Groups** could retain the previous account's groups if the new-account membership reload failed. Identity change now clears group/congregation/invite state before reload.
3. **Team Center** could retain the previous account's teams or directory on a failed new-account load. Identity change now clears account-scoped team/directory state first.
4. **Couples Cloud** could retain the previous account's pair/shared history when a new-account pair load failed. Pair/shared/invite state now invalidates immediately on identity change.
5. **Live Rooms** could carry prior-account room context across an identity switch and risk silently rejoining under the new account. Membership identity change now clears room and membership state before reloading.

## Architecture and backend boundary

No Supabase schema, migration, RLS policy, Edge Function, production-data contract, or service ownership was changed for Section I. The fixes are account-context invalidation inside the existing client service owners.

`src/core/api.js` remains the shared API boundary. A public Supabase endpoint and publishable client key are permitted there as part of the existing browser client contract; privileged/service-role/browser-secret credentials remain explicitly forbidden by the Section I static gate.

## Certification-lock reconciliation

Section I intentionally changed the existing Assignments and Couples client service owners to close stale-account state leakage. Older V4 certification tests that byte-locked those entire files were therefore narrowed without weakening their behavioral/security contracts:

- Assignments still preserves its public API, own-user/congregation permission rules, architecture owner, and no-direct-fetch/no-privileged-shortcut requirements while explicitly asserting account-context invalidation.
- Couples still preserves its public service API, pair ownership/shared-row scoping, architecture owner, and no-direct-fetch/no-privileged-shortcut requirements while explicitly asserting identity invalidation.

All unrelated certified owners and backend contracts remain protected by their existing guards.

## Remaining release boundary

Section I is complete as an automated/security release gate. Final V4 promotion still depends on the exact final-RC convergence plus the explicitly separate real-device/installed-PWA field checks recorded under Section H and Section J.
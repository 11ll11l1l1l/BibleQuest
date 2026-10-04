# BibleQuest v3 — guarded Live Room field harness

Updated: 2026-09-12 JST

This is a release-validation supplement to `RELEASE_FIELD_VALIDATION_V3.md`. It does not close Issue #68 by itself, does not replace physical-device/network/PWA evidence, and does not add product scope.

## Current v3 contract

The current #43 Live Rooms implementation and its permanent browser regression cover the shipped Live Room contract:

- authorized congregation host creates a room;
- eligible congregation member joins by short room code;
- participant state propagates through the shared realtime channel;
- route teardown/re-entry reconnects the retained active room;
- a browser refresh may rejoin by the supported room-code path;
- participant upsert prevents the same account from becoming duplicate room members;
- only the host can end the room;
- room end propagates to joined clients;
- ended/unknown room codes do not restore active room state;
- leaving clears stale client room state.

The current Live Rooms UI/service does **not** expose a room question/answer/scoring round. Field validation must not invent one merely to satisfy older wording. The authoritative inventory acceptance for #43 remains `create/join/leave; reconnect; no stale room state`. If a future product decision adds room gameplay, that is separate scoped development and requires its own architecture and verification work.

## Harness

`tests/v3-field-live-room-harness.mjs` exercises the actual production UI/auth/API/RLS/realtime path with three independent browser contexts.

Required environment:

```text
BQ_FIELD_HOST=https://<approved-field-host>
BQ_FIELD_ALLOW_MUTATION=1
BQ_FIELD_A_EMAIL=<authorized host account>
BQ_FIELD_A_PASSWORD=<secret>
BQ_FIELD_B_EMAIL=<same-congregation member>
BQ_FIELD_B_PASSWORD=<secret>
BQ_FIELD_C_EMAIL=<unrelated/different-congregation account>
BQ_FIELD_C_PASSWORD=<secret>
BQ_FIELD_EVIDENCE_PATH=<optional sanitized JSON output path>
BQ_FIELD_HEADED=1   # optional; omit for headless supplemental run
```

Run:

```text
node tests/v3-field-live-room-harness.mjs
```

Account prerequisites:

- Account A must have a congregation role that exposes the current Host a Live Room UI.
- Account B must be an eligible member of A's congregation.
- Account C must be outside A's congregation for the valid-code isolation assertion. If C is intentionally a member of A's congregation, it is a legitimate room joiner and is not a valid negative-isolation account for this harness.

## What the run proves

A successful run records sanitized evidence for:

1. A creates a harness-tagged room through the product UI.
2. B joins the exact room from an independent authenticated browser context.
3. A receives B's participant membership through realtime propagation.
4. B leaves the route and returns; the retained service reconnects to the same room without stale state.
5. B hard-refreshes and uses the supported code rejoin path.
6. A still sees exactly two unique participant rows after B rejoins.
7. C cannot enter A's congregation-backed room when C is a true unrelated/different-congregation test account.
8. A ends the room through the product UI.
9. B receives the ended state through realtime and is not offered reconnect.
10. B cannot restore the ended room and an unknown syntactically valid code is rejected safely.
11. No browser `pageerror` is tolerated in any of the three sessions.

Room codes, passwords, tokens and account emails are intentionally excluded from evidence output.

## Safety and cleanup

The harness is mutation-gated and fails closed unless `BQ_FIELD_ALLOW_MUTATION=1` is explicitly supplied. It performs user actions only through normal product UI/API paths and does not use service-role or direct database mutation.

The host ends the temporary room through the UI. Because the current product end flow intentionally marks the room ended rather than deleting retained session/participant rows, any harness-tagged rows that release policy requires removed must be cleaned by the normal approved operator procedure. The harness does not escalate privilege to delete them.

## Remaining manual evidence

This harness is supplemental. The release still requires the full `RELEASE_FIELD_VALIDATION_V3.md` matrix, including real physical-device/network behavior where required and the Android Chrome, Brave and genuinely installed-PWA gate. A headless PASS must never be reported as physical-device or complete Issue #68 acceptance.

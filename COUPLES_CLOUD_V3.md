# BibleQuest v3 Couples cloud contract

#63 rebuilds the retained `couple-cloud.js` behavior without restoring its global overlay/runtime architecture.

## Recovered backend contract

- `bq-couple` is the trusted server owner for pair status, pair creation, joining by invite code, and leaving a pair.
- A newly created pair is `pending` with the creator as `user_a`.
- Pair codes are 8 characters, hashed before storage, and expire after 14 days.
- A user cannot join their own invite and cannot join while already actively paired.
- Joining fills `user_b` and changes the pair to `active`.
- Leaving changes the pair to `ended`; it does not delete the shared history.
- `bible_couple_invites` is not readable or writable by browser clients.

## Shared-data contract

The v3 browser may read and append only `bible_couple_shared` rows for the authenticated user's currently active pair. The recovered shared item types used by this milestone are:

- `journey` — completion of one of the seven recovered Couple Journey conversations.
- `commitment` — an intentionally entered shared commitment, up to 800 characters in the v3 UI.
- `challenge` — pair-linked couples challenge history created by the existing challenge workflow; #63 displays it but does not own challenge creation or scoring.

The production hardening migration revoked browser `UPDATE` permission for `bible_couple_shared`. #63 therefore treats shared history as append-only and does not add an edit/delete path.

## Privacy boundary

Pairing two accounts does **not** share or inspect:

- Private Notes or any `couples-family-local` device state.
- Transformation results or journals.
- Passwords, recovery codes, remembered-device data, or authentication storage.
- General personal account data outside the minimum pair membership identifiers enforced by the backend.
- Cloud Notes.

The local #62 service and cloud #63 service remain separate owners. #63 has no browser-storage key and never reads or writes the #62 local storage key.

## Architecture boundary

- `src/core/api.js` is the only v3 browser module that invokes `bq-couple` or queries/inserts `bible_couple_shared`.
- `src/app/couples-cloud.js` owns pair/session validation, pair-code validation, shared-row normalization, duplicate journey suppression within loaded state, and cloud workflow state.
- `src/features/couples-cloud/index.js` owns rendering and user interaction only.
- The feature uses the existing central session owner and router.
- Local preview fails closed: no cloud action is attempted when remote account actions are disabled.
- No direct Supabase client, `fetch`, `localStorage`, `sessionStorage`, legacy globals, or DOM-created overlay is allowed in the #63 owner/UI.

## Recovered seven-step Couple Journey

1. Pray Honestly — Philippians 1:9–11
2. Listen First — James 1:19
3. Notice the Good — 1 Thessalonians 5:11
4. Repair Gently — Matthew 7:3–5
5. Build the Home — Colossians 3:12–15
6. Serve Together — Galatians 5:13
7. Us & God — Hebrews 10:24–25

The old implementation called the legacy community points global after a shared conversation. v3 #63 does not reproduce that direct side effect because trusted cloud score submission is owned by inventory row #70 and has not yet been rebuilt. Individual couples challenge points likewise remain outside #63.

## Verification requirement

#63 may be promoted only after permanent tests prove:

- signed-out/local-preview fail-closed behavior;
- 8-character create/join workflow and pair ownership validation;
- active pair shared-state load and malformed/foreign-row rejection;
- seven-step journey completion and optional commitment append;
- duplicate journey completion does not append another journey row within synchronized state;
- challenge history remains read-only in this owner;
- unlink clears active in-memory state and calls the trusted server action;
- no access to Private Notes, #62 local storage, Transform, account secrets, or direct Supabase outside the central API;
- 390px mobile layout has no horizontal overflow and usable touch targets;
- failure/retry paths do not corrupt the current pair state;
- the complete accumulated regression suite remains green.

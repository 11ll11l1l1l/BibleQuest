# BibleQuest v3 Reset / Recovery page contract

Capability #94 rebuilds the retained standalone Account Recovery surface at canonical `/reset`. It is a page/lifecycle capability around the already-verified #9 recovery-code/password transaction. It does not create a second password-reset engine and it does not absorb #100 Backup/export/import/reset.

## Recovered evidence

Live repository history shows that the retained login compatibility helper normalized legacy `reset.html` links to canonical `reset`, `_redirects` maps `/reset.html` to `/reset`, and the PWA explicitly protected `reset.html` / `reset.js` while unrelated utility panels were retired. The retained standalone page collects registered email, saved recovery code, new password and confirmation, delegates the reset to `bq-password-reset`, shows the replacement recovery code after success, requires acknowledgement that the replacement code was saved, and then returns to BibleQuest.

## Ownership

- `src/app/account.js` remains the only #9 account/recovery transaction owner. Its verified `account.resetPassword(...)` performs validation and delegates to the API boundary.
- `src/core/api.js` remains the only browser Supabase/network implementation boundary. #94 does not invoke `bq-password-reset` directly.
- `src/app/reset-recovery.js` owns only standalone page state: ready/submitting/error/success/cancelled, replacement-code acknowledgement, and retry/cancel lifecycle. It stores no email, password, or submitted recovery code in state.
- `src/features/reset-recovery/index.js` owns standalone rendering and user interaction.
- `src/app/reset-entry.js` composes the existing API, Session, Account and Storage owners only so the same verified Account service can be reused. It does not boot a remote authenticated session before account recovery.
- `reset.html` is the standalone shell. `_redirects` continues to own the legacy `/reset.html` → `/reset` compatibility redirect.
- #100 `src/app/backup.js` / storage portable-reset ownership remains separate and unchanged.

## Reset path

1. Open the standalone Account Recovery page.
2. Enter registered email, the previously saved recovery code, a new password and confirmation.
3. Submit once. The page delegates exactly one operation to `account.resetPassword(...)`.
4. On success, the old recovery code is invalidated by the existing trusted backend and a replacement recovery code is shown.
5. The Return action stays disabled until the user confirms that the replacement recovery code was saved.
6. Finishing returns to BibleQuest so the user can sign in with the new password.

The standalone page must never expose a recovery code through a global event, URL, persistent storage, or logging.

## Cancellation

Before submission, Cancel/Back returns to BibleQuest without invoking the recovery transaction. While a reset request is already submitting, cancellation controls are disabled because a sent password-reset transaction cannot truthfully be promised as cancelled. After an error, the page is retryable or can be cancelled normally.

## Invalid/error state

Validation and invalid-code messages come from the existing #9 Account/API boundary and are shown as safe text. A failed request must not falsely show success, must not reveal whether another account exists beyond the server's approved error contract, and must leave the form retryable. Missing/unavailable cloud configuration is represented by the existing API/account failure path rather than a second direct configuration implementation.

## Security and privacy

- No direct `fetch`, Supabase client creation, service key, direct database access, `localStorage`, or `sessionStorage` in #94 service/UI.
- Submitted email, password, confirmation and recovery code are not copied into the #94 state snapshot.
- Replacement recovery code exists only in transient in-memory success state and rendered UI until the page is left/cleared.
- HTML escaping/textContent is required for error and code presentation.
- Clipboard copy is user initiated; manual copy remains possible if clipboard permission fails.
- No production Edge Function deployment, schema migration, production data edit, Cloudflare deployment, or `main` change belongs to #94.

## Explicitly separate

- #9 Recovery code/password recovery owns the transaction, validation, code rotation and backend contract.
- #100 Backup/export/import/reset owns reset of portable local BibleQuest data.
- #96 Operational recovery/error boundary owns application runtime recovery.
- #93 Admin Operations owns Owner account deletion.

## Verification

Targeted acceptance must prove canonical shell composition, no legacy/direct backend runtime in `reset.html`, single delegation through Account, no submitted secrets in state, invalid/error retry, pre-submit cancellation without a reset call, submit-time cancellation guard, replacement-code acknowledgement, return path, 390 px mobile layout without horizontal overflow, and permanent accumulation into the dispatch-only v3 workflow. The complete accumulated architecture, edge/security and browser/mobile suite remains mandatory before promotion.

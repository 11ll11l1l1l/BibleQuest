# V5 Phase 7 — Couples Journey sharing verification

Authority target: `v5/feature-completion`.

This evidence is intentionally limited to V5 feature-completion behavior. It does not redesign the Couples domain, state model, API, or database architecture.

## Contracts under verification

- Either member of an active couple can create an intentionally shared Journey commitment.
- After refresh, each spouse receives pair-scoped shared history authored by either spouse.
- Shared rows cannot cross the active `pair_id` boundary in the client service.
- Pair status/leave authorization treats `user_a` and `user_b` symmetrically.
- The pair creator cannot consume their own invite.
- Couples presentation does not acquire Private Notes, Transformation results, password, or personal-account owners.
- Browser-authored shared history remains append-only: authenticated UPDATE remains revoked and the legacy pair-update policy remains removed.
- At a representative 390 px viewport, the real Couples page can render both partners' shared commitments without horizontal overflow or browser page errors.

## Exact-head evidence

Run `.github/workflows/v5-couples-sharing-reverify.yml` on the PR candidate. Required green evidence:

- **STATIC** — `bash build.sh`.
- **STATIC** — `node tests/v5-couples-sharing-reverification.mjs`: bidirectional service behavior, wrong-pair rejection, privacy copy/ownership assertions, symmetric Edge Function membership checks, and append-only hardening assertions.
- **BROWSER-AUTO** — `node tests/v5-couples-sharing-browser.mjs`: real `couplesCloudPage` rendering at 390×844 using two independently authenticated service instances sharing one pair fixture; each rendered view must show both spouses' commitments, preserve privacy copy, avoid horizontal overflow, and emit no page errors.
- **STATIC** — exact candidate SHA and tracked-source-clean checks after validation.

## Evidence boundaries

This tranche does **not** claim **BACKEND-E2E** because it does not create real Supabase accounts/pairs or mutate a deployed Supabase environment. It also does not claim **DEVICE/FIELD** evidence. Database privacy is therefore supported here by current checked-in Edge Function/migration invariants plus client behavior characterization, not by a live production/staging RLS exercise.

If the exact-head workflow is green, the supported conclusion is: the current V5 client/domain contract is bidirectional for intentionally shared Couples Journey history, rejects cross-pair rows, preserves documented private-data boundaries, and renders the verified shared state on a narrow browser viewport. It is not evidence that every deployed backend policy has been exercised end-to-end.

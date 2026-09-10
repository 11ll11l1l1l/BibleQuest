# BibleQuest v3 Content Review contract

Milestone: **#91 Content Review workbench**

Base release: `release/v3.61-content-moderation` at `dfbbb690c814a514714967f240262eec39b6e3ee`.

## Purpose

Rebuild the retained congregation Content Review workflow inside the v3 architecture. Authorized reviewers can inspect quarantined Recall questions and member content reports, choose an existing moderation decision, save an optional bounded rationale, and resolve matching open reports.

This milestone is reviewer workflow only. It does not implement the broader Admin Console (#92), Admin Operations (#93), reset/recovery (#94), new moderation schema, bulk moderation, escalation workflow, content revision/editor features, or production deployment.

## Authority and ownership

- Session remains the only authenticated-user owner.
- Congregation Membership remains the only client membership/role projection owner.
- `src/core/api.js` remains the only browser Supabase implementation boundary.
- Recall Pack service remains the only owner of bundled quarantine-file loading.
- Content Review service owns reviewer eligibility projection, selected congregation, review queue state, decision validation, snapshots, save orchestration and error state.
- Content Review UI is presentation/interaction only. It must not query Supabase, read local/session storage, install global listeners, use `MutationObserver`, or expose `window.BQ*` state.
- Router remains the only route/history owner.
- Database RLS remains final authority even when client role projection allows a control.

## Reviewer eligibility

A signed-in user may review a congregation when either condition is true:

1. Their current congregation membership role is `leader`, `pastor`, or `admin` for that congregation; or
2. Their active platform role in `bible_app_access` is `owner` or `admin`.

`member` and `facilitator` do not receive Content Review authority. Unknown roles fail closed.

Platform owner/admin may use the retained reviewer RLS path to access reviewable congregations even without direct membership. The service must never infer platform authority from email, local state or UI labels.

## Queue sources

### Quarantine

- Book list comes from the verified Recall manifest owner.
- Quarantine rows come only from `recall.loadQuarantine(code)`.
- Content key is `question:<BOOK_CODE>:<item_id>`.
- Origin is `quarantine`; content type is `question`.
- Snapshot preserves book code, id, question, answer, reference and safety metadata.

### Member reports

- Reports come from `bible_content_reports` through the shared API.
- Review queue is congregation-scoped and bounded to the newest 500 rows.
- Exact stored content key/type/source/reference/text/payload/reason/note/status are retained for review presentation.
- Reporter display names may be resolved from the current congregation member directory returned through the API.

## Decisions

The only valid decision values are the database contract values:

- `include` — content is available/kept for this congregation.
- `exempt` — content remains quarantined/hidden from normal play.
- `remove` — content is rejected/hidden for this congregation.

The legacy editor's later `delete` value is database-incompatible and must not be reproduced.

Rationale is optional and bounded to 1,200 characters. Content keys, types, origins and references must be validated before write orchestration. Reviewer identity is always taken from Session, never accepted from UI input.

Saving a decision upserts `bible_content_decisions` using `(congregation_id, content_key)` and stamps `reviewed_by`, `reviewed_at` and `updated_at`. Matching open reports are then updated to `reviewed` with the same reviewer/stamp. A decision-write failure is a hard failure. If the decision saves but report resolution fails, the service must surface a partial-save error rather than claim atomic success.

## UI behavior

- Route: `content-review` inside the v3 Router.
- Entry point: More → Content Review; access is still checked by the service/server, not by visibility alone.
- Signed-out state offers Account navigation.
- Unauthorized signed-in state explains that Leader/Pastor/Admin review access is required and offers Congregation navigation.
- Authorized state provides congregation selection, Quarantined Questions and Member Reports tabs, search, decision-state filter, item cards, optional rationale and explicit Include / Keep quarantined / Remove actions.
- Save controls disable while a write is active and success/error state is visible without a page reload.
- Minimum touch targets: 44 px; 390 px viewport must have no horizontal overflow.

## Failure behavior

- Auth/membership/platform-access failures fail closed.
- Unsupported congregation selection is rejected.
- Malformed queue rows are ignored rather than promoted into reviewer state.
- Quarantine-file absence produces an empty quarantine list for that book, consistent with the verified Recall owner.
- Backend/RLS/network failures remain visible errors; no optimistic success is invented.
- Clear/leave removes in-memory review state only and does not mutate content decisions.

## Required permanent verification

1. Architecture validator proves no direct Supabase/storage/global/navigation bypass and verifies workflow composition.
2. Edge regression covers signed-out, member/facilitator denial, leader/pastor/admin membership access, platform owner/admin access, congregation scoping, queue normalization, exact decision values, rationale bounds, snapshot creation, successful save, report resolution, backend denial and partial-save failure.
3. Browser regression mounts the real Content Review UI with a deterministic fake service to exercise queue switching, filtering, item opening/decision save, visible failure handling and 390 px touch/overflow behavior; normal app routing also verifies signed-out containment.
4. The accumulated `v3-regression.yml` invokes all #91 permanent tests while remaining `workflow_dispatch` only on the product branch.

## Release rule

#91 cannot become Verified until one exact clean functional candidate passes targeted verification and then the complete accumulated architecture, edge/security and browser/mobile suite. Any bookkeeping change after that requires its own exact-SHA complete gate before the next release freeze.
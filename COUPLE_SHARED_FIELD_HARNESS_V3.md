# BibleQuest v3 — Couple Journey shared-state field harness

Updated: 2026-09-12 JST

This is a guarded supplemental operator harness for the remaining Issue #68 field-validation work. It does not change product/runtime behavior, Supabase schema, RLS, or release scope. `RELEASE_FIELD_VALIDATION_V3.md` remains authoritative.

## Purpose

`tests/v3-field-couple-shared-harness.mjs` exercises the production Couple Journey UI with genuinely separate authenticated browser sessions.

It validates the current A4/A5 shared-state boundary that can be proven through the shipped Couple Journey surface:

- Account A and partner Account D are linked through the normal production pair-code UI when a dedicated pair is not already active;
- Account A completes a Couple Journey conversation and saves a uniquely labeled shared commitment through the production UI;
- Account D observes the same completed Journey step and shared commitment from its independent session;
- unrelated Account C cannot see the pair-shared commitment;
- A and D retain the same shared state after full route reload;
- browser page errors remain empty during the run;
- sanitized JSON evidence may be written without emails, passwords, tokens, or pair codes.

This harness intentionally does **not** manufacture `challenge` rows, directly insert database records, or claim the A5 couples-type congregation challenge is complete. The A5 pair-day/individual-points semantics still require the supported challenge UI path and genuine field observation described in `RELEASE_FIELD_VALIDATION_V3.md`.

## Safety contract

The harness is fail-closed.

It requires:

- `BQ_FIELD_ALLOW_MUTATION=1`;
- dedicated Account A, Account C, and Account D credentials supplied only through environment variables;
- an HTTPS production/staging host, except explicit localhost/127.0.0.1 testing;
- Account C to be unrelated to the A/D pair.

Do not use personal production accounts. The Couple Journey product contract makes shared history append-only from the app, so the harness labels its shared commitment with a unique field run ID rather than bypassing the product to delete it afterward.

If A and D are already active, the harness does not assume they are paired to each other. The unique shared commitment must appear in D's session; otherwise the run fails.

## Required environment

- `BQ_FIELD_A_EMAIL`
- `BQ_FIELD_A_PASSWORD`
- `BQ_FIELD_C_EMAIL`
- `BQ_FIELD_C_PASSWORD`
- `BQ_FIELD_D_EMAIL`
- `BQ_FIELD_D_PASSWORD`
- `BQ_FIELD_ALLOW_MUTATION=1`

Optional:

- `BQ_FIELD_HOST` — defaults to `https://mybiblequest.pages.dev`
- `BQ_FIELD_EVIDENCE_PATH` — sanitized JSON evidence output path
- `BQ_FIELD_HEADED=1` — show the Playwright browser for operator observation/screenshots

## Run

```bash
BQ_FIELD_ALLOW_MUTATION=1 \
BQ_FIELD_A_EMAIL='...' \
BQ_FIELD_A_PASSWORD='...' \
BQ_FIELD_C_EMAIL='...' \
BQ_FIELD_C_PASSWORD='...' \
BQ_FIELD_D_EMAIL='...' \
BQ_FIELD_D_PASSWORD='...' \
BQ_FIELD_EVIDENCE_PATH='artifacts/couple-shared-field.json' \
node tests/v3-field-couple-shared-harness.mjs
```

Use `BQ_FIELD_HEADED=1` when the operator needs direct UI observation or screenshots. Credentials must remain outside committed files and evidence.

## PASS meaning

A green harness run is supporting field evidence that the shipped Couple Journey shared owner works across the intended A/D pair and remains isolated from C for the tested Journey/commitment path.

It is **not** sufficient by itself to close Issue #68. The remaining Issue #68 matrix still includes Journey Group/assignment/team/challenge/Live Room and required permission/isolation checks under `RELEASE_FIELD_VALIDATION_V3.md`. Issue #6 physical Android Chrome/Brave/installed-PWA validation is also unaffected.

If the harness fails, preserve the smallest sanitized reproduction and follow the field failure route in `RELEASE_FIELD_VALIDATION_V3.md`. Do not weaken auth/RLS, bypass the production owner, or change validation solely to obtain green.

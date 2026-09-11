# BibleQuest v3 — Product/Documentation Reconciliation

Status: cumulative integration restored and exact-SHA verified
Updated: 2026-09-11 JST

## Current product truth

Repository evidence now contains one cumulative post-release product candidate that joins the previously divergent verified lines:

- cumulative exact-green product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- integration branch: `integration/v3-cumulative-line-a-line-b-20260911`
- verifier branch: `verify/v3-cumulative-cf17f36-20260911`
- verifier run: `34610903807`
- verifier conclusion: **success**
- parent 1 / verified Line A: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`
- parent 2 / verified full Line B: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`

The exact cumulative candidate contains:

- Assignment Private Responses `73d39ce6fe0f9db20db62e25fd497a8711f921b0`;
- Workspace schema compatibility `61ee54fac7d352312cef7ffd8010997fa8bc9e51`;
- Visual tranche 18 `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`;
- Avatar Vault v2 `7ce6685a7383102f29797869a77eabcf7ab9c0c2`;
- Calendar v1.5 `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`.

The historical Line A / Line B merge base was `545b5b98d88ca04001d3675317c37cbcd3306955`. That divergence is now resolved in `cf17f36...`; do not continue describing the repository as having no cumulative candidate unless newer repository evidence proves a new divergence.

## Verification earned by `cf17f36...`

Run `34610903807` checked out the product SHA itself and passed:

- exact candidate and exact two-parent ancestry assertion;
- cumulative Assignment + Workspace + Visual18 + Avatar + Calendar integration contract;
- focused Assignment response privacy regression;
- Workspace/Cloud Notes deployed-schema compatibility regression;
- Avatar Vault v2 regression;
- Calendar v1.5 regression;
- green/gold and Visual18 visual contracts;
- deployment gate (`build.sh`);
- complete accumulated architecture validators;
- complete accumulated edge regressions;
- Playwright/Chromium setup;
- local runtime startup;
- complete accumulated browser/mobile regression suite.

Do not transfer this PASS to a changed product SHA.

## Production and `main`

- production/runtime product SHA remains `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`;
- frozen rollback/reference remains `release/v3-production-20260911-r3`;
- live `main` recovered after cumulative verification remains `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`;
- production and Supabase were **not** changed by the cumulative integration/verification work.

`cf17f36...` is now technically eligible to be selected for controlled promotion, but promotion is a separate step. Do not infer Cloudflare/live deployment from this verification.

## Required production migration gates

### Assignment response presence

Canonical migration:
`supabase/migrations/20260911131000_assignment_response_presence.sql`

Reviewed blob:
`bbbceb057c631f08ec32826384ef6fcd61da4527`

Production application state is unknown. Treat it as `NOT APPLIED / UNKNOWN` until positively verified. Read `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before production integration. Because it `create or replace`s `private.bible_assignment_visible(...)`, compare the deployed helper definition before applying. After application run live authorization/privacy smoke before recording `APPLIED + LIVE VERIFIED`.

### Calendar

The cumulative candidate also contains Calendar migrations:

- `supabase/migrations/20260911_calendar_events.sql`
- `supabase/migrations/20260911140000_calendar_congregation_sharing.sql`

Repository presence is not proof of production application. Recover actual production migration/schema state before promotion/deployment and apply only as part of the compatible controlled release. Run Calendar authorization/behavior smoke afterward.

## Document authority

When documents disagree:

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md` for cross-feature task selection;
3. this file for cumulative product/integration truth;
4. `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`;
5. feature-specific contracts inside that feature only;
6. exact-SHA workflow evidence;
7. historical release/investigator/ledger documents as evidence only.

A feature contract cannot overwrite cross-feature status merely because a divergent branch used the same filename.

## Visual/icon reference

`docs/V3_ICON_ASSET_MAP.md` is the canonical semantic assignment map for the analyzed 70-PNG family. The guide does not prove the PNG binaries are already present. Before wiring icons, verify/import the exact asset set under the documented canonical path, then implement mapped assets without inventing features and without routine visual approval stops.

## Next safe gate

1. keep `cf17f36...` frozen as the current exact-green cumulative product checkpoint;
2. keep any following documentation-only commit explicitly separate from the product SHA;
3. review live `main` again immediately before promotion to detect concurrent changes;
4. select controlled `main` promotion only after confirming migration/release sequencing;
5. verify production Supabase migration state before executing schema changes;
6. after promotion/deployment, verify Cloudflare propagation and live privacy/authorization behavior separately.

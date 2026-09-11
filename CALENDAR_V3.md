# BibleQuest v3 — Calendar Implementation Contract

Status: active Priority 1 implementation contract
Updated: 2026-09-11 JST

## Objective

Calendar is an approved active Priority 1 BibleQuest objective. It must be implemented through the existing v3 architecture rather than as a separate parallel application or duplicate global scheduling system.

## Discovery requirement

Before product code changes, inspect repository history, branches, issues, feature contracts and existing scheduling/date owners for any prior Calendar requirements. If newer authoritative Calendar requirements are found, reconcile them into this contract before implementation.

At the time this contract was created, no authoritative Calendar document was found on the current `main` code search.

## Ownership boundaries

The Calendar implementation must:

- define one clear feature/presentation owner;
- reuse the established application router/state/API boundaries;
- avoid a second Supabase client or competing backend owner;
- avoid duplicate global date/time state;
- reuse assignment, journey, notification, event or scheduling data only where their existing contracts genuinely support it;
- keep authorization and congregation/member privacy boundaries intact;
- keep production Supabase/data unchanged until a separately selected integration step requires a verified migration/configuration change.

## Functional scope rule

Do not invent broad Calendar functionality merely because a calendar UI is possible. Recover and implement the accepted product requirements in dependency-safe increments.

For each Calendar tranche/milestone, explicitly record:

- user-visible behavior being added;
- data source/owner;
- persistence model;
- date/time/timezone behavior;
- authorization/privacy expectations;
- offline/PWA behavior where relevant;
- mobile/desktop acceptance criteria;
- focused regression protection.

## Mobile and accessibility

Calendar is mobile-first. Verify representative narrow widths, touch targets, scrolling/overflow, keyboard/focus behavior, readable labels, reduced-motion behavior where applicable, and desktop/tablet containment.

## Integration rule

Calendar is Priority 1 and must not be indefinitely deferred until every visual/cosmetic task is complete. If a prerequisite owner or data contract is incomplete, complete that prerequisite first and continue into Calendar without requiring another routine approval.

Calendar visual presentation should follow active `VISUAL_PHASE_B_V3.md` where artwork/icons/backgrounds are relevant.

## Verification

Every changed Calendar product SHA must earn its own evidence:

1. syntax/static checks;
2. focused Calendar architecture/data/behavior tests;
3. focused browser/mobile acceptance;
4. relevant accessibility/PWA/offline checks;
5. accumulated v3 architecture, edge/security/static and browser/mobile regressions at the exact milestone checkpoint;
6. no PASS transfer from an older SHA.

## Production boundary

A verified development Calendar milestone is not automatically production-live. Production integration requires separately selected exact candidate promotion, any required migration review/deployment, Cloudflare propagation confirmation and live smoke/authorization verification.

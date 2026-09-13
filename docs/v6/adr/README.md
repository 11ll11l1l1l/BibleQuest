# BibleQuest V6 Architecture Decision Records

V6 is explicitly allowed to change architecture. ADRs make those intentional changes recoverable and prevent chat/temporary implementation details from becoming invisible architecture policy.

## Status values

- `PROPOSED` — investigation/spike may proceed; not yet the architecture contract.
- `ACCEPTED` — current architecture contract.
- `SUPERSEDED` — replaced by a later ADR; preserve for history.
- `REJECTED` — considered but not adopted.

## ADR rule

Create or update an ADR before merging a change that materially alters build/runtime architecture, persistence/storage strategy, tenant model, auth/security contract, media/push infrastructure, offline synchronization, or a major domain ownership boundary.

An ADR must include:

1. context from the actual BibleQuest codebase;
2. decision;
3. alternatives considered;
4. consequences/tradeoffs;
5. migration path from current production behavior;
6. tests/evidence required before old architecture is removed;
7. rollback implications.

## Initial ADR queue

- ADR-0001 — V6 build/client architecture: Vite + TypeScript and selected component migration strategy.
- ADR-0002 — Ephemeral Supabase/Postgres in CI and deterministic tenant seed topology.
- ADR-0003 — Active-congregation/tenant context and data-access boundary.
- ADR-0004 — Offline Scripture storage/content manifest strategy.
- ADR-0005 — Games engine contracts.
- ADR-0006 — Media session/provider architecture.
- ADR-0007 — Web Push and notification delivery architecture.
- ADR-0008 — Offline mutation/outbox/conflict strategy.

## Template

```md
# ADR-NNNN — Title

Status: PROPOSED | ACCEPTED | SUPERSEDED | REJECTED
Date: YYYY-MM-DD
Supersedes: none

## Context

## Decision

## Alternatives considered

## Consequences

## Migration

## Required evidence

## Rollback
```

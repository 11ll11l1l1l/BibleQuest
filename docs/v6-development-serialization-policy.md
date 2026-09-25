# BibleQuest V6 development serialization policy

This policy exists to keep parallel V6 development fast without repeatedly invalidating other workers.

## Canonical integration branch

- `v6/architecture-upgrade` is the only V6 integration source of truth.
- Feature work happens on feature branches. Do not use the integration branch as the head of a PR whose base is a feature branch.
- A feature branch may continue non-overlapping development after integration moves, but it is not merge-ready until it contains the current integration head.

## Refresh rule

When `v6/architecture-upgrade` advances:

1. Refresh the existing feature branch from the current integration branch.
2. Preserve the feature branch's own commits; do not replay unrelated work and do not force-reset shared work.
3. Push the refreshed feature branch.
4. Keep the existing canonical PR when practical. Do not create a reverse synchronization PR.
5. Rerun the required exact-head gates.

The V6 PR Serialization Guard automatically marks open V6 PR heads stale after integration advances and rejects reverse synchronization PRs.

## One canonical PR per change surface

- Keep one merge candidate per feature/change surface.
- Verification-only or temporary dependency PRs must not become competing integration candidates.
- When a replacement PR is proven green, close the superseded PR immediately and reference the replacement.
- Draft PRs may remain open for active work, but their description must not claim current-base readiness when the branch is stale.

## Merge train

- Integrate one verified candidate at a time.
- After every integration merge, treat every other open V6 PR as stale until the serialization guard confirms that its head contains the new integration commit.
- Directors should refresh the next candidate only after the previous integration move is known, rather than preparing several exact-base replays in parallel.

## Safety rules

- Never weaken tests merely to make a stale branch green.
- Never solve a branch freshness problem by copying code from another stream without preserving history.
- Never force-push a shared agent/director branch unless explicitly recovering from a known corrupted history state.
- Runtime, database/RLS, PWA/service-worker, Reader/content, and other owned surfaces keep their normal ownership boundaries during refreshes.

## Required merge evidence

A V6 PR is eligible for integration only when:

- its head contains the current `v6/architecture-upgrade` head;
- V6 PR Serialization Guard is green;
- its required V6 Phase 1 / database / security / inherited regression gates are green for that exact head;
- it has no unresolved ownership collision with the integration candidate ahead of it.

# V5 Phase 1 aggregate assignment lifecycle decision evidence

Base integration commit: `33edaaa3731473ff95284f1ceccb53131e09f26f`
Evidence class: STATIC decision/data-truth analysis only

## Current authoritative facts

`bible_assignments` is the assignment owner. It records `target_scope` (`all`, `member`, `team`, `group` after later migrations), `target_id`, `schedule_at`, `due_at`, `active`, and assignment content. It does not store an assignment-level completion state.

`bible_assignment_progress` is authoritative per user. Its status is `assigned`, `started`, or `completed`; completed rows carry `completed_at`. The current service deliberately normalizes only the signed-in user's progress into ordinary assignment rows.

`bible_assignment_response_presence` is a privacy-safe projection of completed responders, trigger-maintained from `bible_assignment_progress`. It proves who completed an assignment without exposing response text to peers. It is a completion numerator, not an audience denominator.

The current Edge Function already has authoritative recipient membership tests for an individual user, but it does not expose a frozen or aggregate recipient set for an assignment.

## Why Phase 1 cannot truthfully derive `completed` yet

A truthful aggregate `completed` state requires both:

1. a completion rule; and
2. an authoritative denominator of recipients to whom that rule applies.

Neither is currently declared. Counting `bible_assignment_progress` or response-presence rows alone is invalid because recipients who never started/completed have no required progress row. Using one member's `completed` status is also invalid for an aggregate leader lifecycle.

## Denominator choices by existing target mode

| Target mode | Candidate live denominator | Current source | Security/privacy | Semantic risk |
| --- | --- | --- | --- | --- |
| `member` | the one active targeted member | `target_id` + active congregation membership | low; no private response needed | clear only after product decides whether inactive/removed target still counts |
| `team` | current team members | `bible_team_members` for `target_id` | ministry-authorized aggregation can avoid response text | membership can change after publication, so historical completion can move backward/forward |
| `group` | current active group members | `bible_group_members` + active group/congregation | ministry-authorized aggregation can avoid response text | membership can change after publication; same moving-denominator problem |
| `all` | current active congregation members | `bible_congregation_members` for assignment congregation | aggregation can use IDs/counts only; private submissions must remain excluded | congregation joins/leaves after publication change denominator unless audience is frozen |

## Viable product rules

### A. Live-audience / all-current-recipients completed

`completed` when every currently eligible recipient has a completed progress/presence row.

Advantages: smallest current-architecture implementation; no new durable recipient table is required.

Risks: team/group/congregation membership changes after publication change the denominator. A newly joined member can turn a previously completed assignment back into incomplete; a departing member can make it complete. This is truthful only if the product explicitly defines lifecycle completion against the *current* audience.

### B. Publication-time frozen audience / all-original-recipients completed

`completed` when every recipient resolved when the assignment was published has completed.

Advantages: stable historical meaning.

Risk/current gap: BibleQuest does not persist the resolved recipient set at publication. Implementing this rule requires a new durable recipient snapshot owner/schema and migration/RLS design. That is materially larger than a projection and must not be smuggled in as an inferred aggregate.

### C. Deadline-driven completion

Treat the assignment as completed/closed at `due_at`, independently of member completion.

This is not supported by the requested wording or current data semantics: `due_at` currently means deadline/overdue, not successful completion. It would conflate closure with completion and should not be adopted without an explicit product decision.

### D. Any-recipient completion

Treat the assignment as completed after one recipient completes.

Rejected as a default: this would misrepresent group/congregation assignment completion and can be derived accidentally from one member, which the V5 authority explicitly prohibits.

## Recommended decision boundary

Do not implement aggregate `completed` until product authority chooses between A (live audience) and B (publication-time frozen audience), and defines treatment of inactive/removed recipients. If V5 chooses A, the smallest implementation is an owner-side leader aggregate projection that resolves the current target audience, counts only recipient IDs, joins/counts completed progress/presence, and returns counts/state without exposing submissions or private reflection content. No parallel assignment table is needed.

If V5 chooses B, record it as a persisted-data requirement first. A2 must separately review the additive/idempotent schema, RLS and publication transaction before implementation.

## Published and scheduled states

These do not require new authority:

- `scheduled`: active assignment with a valid `schedule_at` later than now.
- `published`: active assignment that is not scheduled in the future and is not aggregate-completed under the eventually approved completion rule.

`completed` must remain unavailable rather than guessed until the rule above is approved.

## Privacy/security constraints for any future aggregate

- Aggregate state may use recipient IDs/counts and completed presence/status only.
- Do not expose `submission`, `leader_feedback`, Couples/private reflection content, Transform content, or unrelated profile data.
- Congregation scope and ministry authorization remain mandatory server-side.
- `all`, `team`, and `group` denominator resolution must be constrained to the assignment's congregation and active owner records.
- No client-calculated denominator should become authoritative.
- RLS/grants must not be widened to make aggregate counting convenient.

## Acceptance consequence

The Phase-1 `published/scheduled/completed` checklist item remains OPEN. Existing data can support a live-audience projection if that semantic is explicitly approved, but repository evidence does not currently authorize selecting it over a frozen publication-time audience. This document is decision evidence, not implementation acceptance.
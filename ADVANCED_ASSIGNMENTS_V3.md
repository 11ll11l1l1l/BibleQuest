# BibleQuest v3 Advanced Assignments Contract

Updated: 2026-09-10 JST

This contract covers inventory row **#74 Advanced assignments** only: recovered advanced fields, due/open state, completion requirements, and member/ministry permission boundaries. It extends the single #73 Assignments owner. It does not implement #75 Assignment push workflow, #76 Ministry Hub, #77 Notification Center/inbox, #78 Workspace, or #79 Linked activities/challenges.

## Retained behavior recovered before implementation

The retained advanced assignment path added these fields to `bible_assignments` and `bq-assignment`:

- `schedule_at` — assignment opening time;
- `reminder_at` — stored reminder metadata;
- `recurrence_rule` — bounded stored recurrence rule;
- `required_reflection` — written reflection required before completion;
- `min_quiz_score` — minimum 0–100 quiz score supplied at completion;
- `evidence_type` — `none`, `text`, or `confirmation`;
- `linked_activity` — retained by the backend but intentionally excluded from #74 client ownership because launching linked activities is inventory row #79.

The old advanced UI explicitly stated that recurrence rules are stored and visible while automatic recurrence generation remains disabled until a server scheduler exists. #74 preserves that boundary.

## Ownership

`src/app/assignments.js` remains the sole Assignments application owner. There is no second advanced-assignment service. It normalizes the advanced fields, derives due/open state, and guards member start/completion requirements before invoking the existing API.

`src/core/api.js` remains the sole browser Supabase/trusted-function boundary. It projects the recovered #74 columns through the existing assignment read and sends only the bounded member submission plus optional quiz score through `bq-assignment` completion.

`src/features/assignments/index.js` remains presentation-only. It renders metadata/requirements and collects the intentional response, confirmation acknowledgement, and quiz score required by the owner.

The retained `supabase/functions/bq-assignment/index.ts` remains the trusted server authority for scheduled opening, assignment visibility, written reflection/text evidence, minimum quiz score, progress persistence, idempotent trusted score award, and authorization.

## Due/open state

The owner derives one display state from server assignment data plus current time:

- `scheduled` — `schedule_at` is still in the future;
- `open` — assignment is available and not past due;
- `overdue` — `due_at` is in the past and progress is not completed;
- `completed` — member progress is completed.

Scheduled assignments cannot be started or completed by the member owner. The server independently rejects start/complete while `schedule_at` is in the future.

An overdue assignment is visibly marked overdue but is not automatically blocked from completion because the retained server contract does not reject late completion.

## Completion requirements

For member completion:

- `required_reflection=true` requires a non-empty bounded submission;
- `evidence_type=text` also requires a non-empty bounded submission;
- `evidence_type=confirmation` requires an explicit UI acknowledgement before the client invokes completion;
- `min_quiz_score` requires a valid 0–100 score at or above the stored threshold;
- submission remains trimmed/bounded to 4000 characters;
- the quiz score is passed to `bq-assignment`; the browser never awards points or writes progress directly.

The retained server function independently enforces scheduled opening, written reflection/text evidence, and minimum quiz score. `confirmation` is a retained client acknowledgement rather than independent server-verifiable evidence; #74 does not misrepresent it as trusted proof.

## Reminder and recurrence boundary

`reminder_at` and `recurrence_rule` are displayed as retained assignment metadata. #74 does not send push notifications, create inbox notifications, schedule background jobs, or generate repeated assignment copies.

`assignmentsContract.recurrenceGeneration` remains `false` until a separately verified server scheduler exists.

## Permission and privacy boundary

The #73 member/ministry split remains unchanged:

- ordinary members may start/complete assignments visible to them;
- ministry roles (`facilitator`, `leader`, `pastor`, `admin`) see this member-oriented surface read-only;
- leader creation/publishing/feedback/archive workflows are not added here and belong to later milestones;
- the selected congregation, RLS, and retained trusted function remain authorization authorities;
- peer progress/submission bodies are never requested by this member surface;
- Private Notes, Cloud Notes, Transform answers, Couple Journey data, credentials, and unrelated personal study state never enter the assignment payload.

## Explicit exclusions

#74 does not expose or launch `linked_activity`; that is #79. It does not create advanced assignments; leader publish/receive is #75. It does not activate stored reminders or recurrence through background jobs. It does not modify production Supabase, production Cloudflare, `main`, or production v2.

## Permanent verification

Permanent coverage proves:

- valid advanced fields normalize without creating a second owner;
- malformed schedule/reminder/evidence/quiz thresholds fail closed;
- deterministic scheduled/open/overdue/completed state;
- scheduled start/complete rejection;
- reflection/text evidence requirement;
- confirmation acknowledgement requirement;
- quiz score validation and minimum threshold, including trusted API handoff;
- recurrence remains metadata-only with generation disabled;
- #73 normal assignment and ministry-role behavior remain green;
- #79 linked activity remains outside the #74 browser projection;
- 390px rendering includes advanced metadata/requirements with no horizontal overflow or console/page errors;
- the complete accumulated architecture, edge, and browser/mobile suite passes against the exact candidate SHA.

## Verification evidence

- Targeted run `34432082061` exposed `V3-ADVANCED-ASSIGNMENTS-VALIDATOR-001`: a case-sensitive validator fixture mismatch for the already-correct recurrence disclosure. No application behavior changed.
- Corrected targeted candidate `2bf160004040f46c9d000ba9e114c51704aefb0d` passed validator + edge run `34432169732`.
- First complete functional run `34432254170` exposed `V3-ASSIGNMENTS-VALIDATOR-FUTURE-STATE-001`: the older #73 validator incorrectly required #74 to remain permanently Not started. The correction preserves #73 ownership boundaries and still keeps #75/#79 closed until their own milestones.
- Corrected exact functional candidate `f01df3e72b5413bba7ae7d16552fca55a448b766` passed the complete accumulated architecture, edge and Playwright/browser-mobile suite in run `34432456615`.
- #74 is therefore Verified; #73 advanced to Regression-tested after surviving that complete suite.

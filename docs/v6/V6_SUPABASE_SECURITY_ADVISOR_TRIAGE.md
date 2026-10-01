# V6 Supabase Security Advisor Triage

Updated: 2026-10-01 JST  
Scope: BibleQuest V6 release-readiness evidence only  
Production mutation in this tranche: **none**

## Purpose

This record triages the current Supabase Security Advisor findings that are relevant to BibleQuest V6 before RC freeze. Triage means every current finding has been inspected, classified, and given an explicit disposition. It does **not** mean every finding has been removed.

Live advisor evidence was read on 2026-10-01. No project reference, credentials, secret values, user content, or personally identifying rows are recorded here.

Supabase references:
- Security Advisor / database linter: https://supabase.com/docs/guides/database/database-linter
- SECURITY DEFINER executable by anonymous callers: https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0028_anon_security_definer_function_executable
- Password security / leaked-password protection: https://supabase.com/docs/guides/auth/password-security

## Current findings and disposition

### INFO — RLS enabled with no policy (13 objects)

Observed objects:

- `bible_admin_audit_log`
- `bible_congregation_invites`
- `bible_couple_invites`
- `bible_password_reset_codes`
- `bible_push_broadcast_delivery`
- `bible_push_broadcasts`
- `bible_push_delivery_ledger`
- `bible_signup_limits`
- `bible_telemetry_events`
- `bible_telemetry_sessions`
- `bible_telemetry_visitors`
- `exam_results`
- `live_exams`

Read-only privilege inspection shows the first eleven BibleQuest/internal tables above have RLS enabled, zero policies, and no `SELECT`, `INSERT`, or `UPDATE` privileges for either `anon` or `authenticated`. Their no-policy state is an intentional deny-all boundary and is not an exposure.

`exam_results` and `live_exams` retain role-level table grants, but RLS is enabled with zero policies, so direct row access remains denied. These two legacy tables should be rationalized or have unused grants removed during final schema cleanup, but the current advisor INFO does not by itself prove exposed row access.

Disposition: **reviewed; no release-blocking vulnerability demonstrated by this INFO class.** Preserve RLS and least privilege.

### WARN — anonymous caller can execute SECURITY DEFINER telemetry RPC

Finding: `public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)`.

This is intentional. BibleQuest telemetry supports guest sessions, so anonymous clients need one bounded write-only ingestion endpoint while the underlying telemetry tables remain unreadable and unwritable directly.

Repository and live-boundary controls reviewed:

- function is `SECURITY DEFINER` with a pinned `search_path`;
- underlying telemetry tables keep RLS enabled;
- `anon` and `authenticated` have no direct telemetry-table DML privileges;
- input batch size is bounded;
- event/property names and values are server-filtered;
- exact Scripture-location properties, UUID-like strings, email-like strings, and free-form sensitive values are rejected by the current telemetry hardening;
- authenticated identity is derived from `auth.uid()`, not caller-provided metadata;
- request rate limiting is enforced before writes;
- return data is limited to ingestion status/count metadata;
- the database function comment marks the endpoint as write-only.

Supabase documents intentionally public `SECURITY DEFINER` API endpoints as a possible reviewed exception when the endpoint is deliberately public and tightly validates/limits its operation. This is the BibleQuest case.

Disposition: **accepted intentional exception with regression guard.** `supabase/tests/v6-security-advisor-triage.test.sql` locks the direct-table denial, pinned search path, and reviewed execution grants.

Residual risk: a public ingestion endpoint can still receive hostile or noisy input. Keep rate limiting, strict property allowlists, storage retention/pruning, and abuse monitoring in place. Do not broaden this RPC into a read path or privileged generic write path.

### WARN — authenticated caller can execute the same SECURITY DEFINER telemetry RPC

Same RPC and same bounded write-only design as above. Signed-in clients use the same ingestion contract, with identity derived server-side.

Disposition: **accepted intentional exception with regression guard.**

### WARN — leaked-password protection disabled

The current Auth configuration reports leaked-password protection disabled.

This is a separate acceptance item from advisor triage. No production Auth setting was changed in this tranche. Before RC, the project must either:

1. enable and verify the supported leaked-password protection control; or
2. explicitly accept the residual risk with a documented rationale and compensating controls.

Disposition: **action required before its dedicated checklist row can pass.** This finding does not block marking the broader “security-advisor findings are triaged” row complete once exact-head repository evidence passes, because it has an explicit unresolved disposition and its own open acceptance gate.

## Release interpretation

Advisor triage is complete when this record and its regression test pass on the exact candidate ancestry. The following must remain separate:

- “Relevant Supabase security-advisor findings are triaged before RC freeze.” — may pass from this evidence after exact-head CI.
- “Leaked-password protection or supported equivalent is enabled/verified or explicitly accepted with rationale.” — remains open.
- Any production Auth, schema, or function-grant change — requires its own reviewed deployment evidence.

No advisor warning should be hidden by weakening RLS, changing a `SECURITY DEFINER` function to invoker without validating its access model, or granting direct telemetry table access.

## Follow-up hardening

A separate schema-hardening tranche should bind telemetry event `(session_id, visitor_id)` to the matching telemetry session as a composite integrity relation, preventing cross-visitor/session attribution even if a caller supplies a known session identifier. The live telemetry tables were empty at the time of this read-only inspection, but that observation is not relied upon as a security control.

That schema change is intentionally not included here because migrations must be generated through the project’s migration tooling and then exercised in disposable Database CI rather than assigned an invented migration version.

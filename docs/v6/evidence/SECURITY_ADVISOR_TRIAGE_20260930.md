# V6 Supabase security-advisor triage evidence — 2026-09-30

This is a read-only evidence snapshot from the connected active BibleQuest Supabase backend. No production configuration or data was changed.

## Current security findings

### Leaked-password protection

Supabase reports leaked-password protection as disabled. This directly keeps the V6 acceptance row `Leaked-password protection or supported equivalent is enabled/verified or explicitly accepted with rationale.` open.

### RLS enabled with no policy

The advisor reports multiple RLS-enabled tables without policies. For the BibleQuest server-only tables sampled in this audit—including admin audit, invitation secrets, password-reset codes, push server state, signup rate-limit state, and telemetry storage—`anon` and `authenticated` have no direct table grants. This makes the no-policy state consistent with a server-only deny-by-default boundary rather than evidence of browser-readable data.

This classification is evidence only; rerun the advisor and privilege audit before RC freeze.

### Public SECURITY DEFINER telemetry ingest

The advisor reports `public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)` as executable by both `anon` and `authenticated`.

The deployed function currently:
- caps a request at 25 events;
- applies a per-minute IP-derived rate limiter;
- validates platform/locale/version/route/event identifiers against bounded patterns;
- whitelists telemetry property keys and bounds string lengths;
- derives authenticated identity from `auth.uid()` instead of caller-supplied identity;
- writes to telemetry tables that have no direct `anon`/`authenticated` table grants.

The public `SECURITY DEFINER` execution grant is therefore an intentional-looking telemetry-ingest boundary, but it remains a privileged exposed RPC. Do not mark the security-advisor acceptance row complete merely from these safeguards. Before RC, explicitly choose and document one of:
1. accept the public telemetry RPC as a reviewed exception with its threat model and abuse controls; or
2. move the ingest boundary to a non-`SECURITY DEFINER`/Edge Function design and remove the warning.

## Performance note

The advisor also reports a missing covering index for the `bible_assignment_response_presence.user_id` foreign key. This is a performance finding, not a security blocker, and should be handled in a separate low-risk migration if profiling/usage justifies it.

## Acceptance impact

No checklist row is promoted by this evidence. The leaked-password row remains open, and the Supabase security-advisor row remains open until the telemetry exception is explicitly accepted or removed and the advisor is rerun at RC freeze.

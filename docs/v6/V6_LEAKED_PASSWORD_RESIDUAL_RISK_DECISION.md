# V6 leaked-password residual-risk decision

Decision date: 2026-10-02 JST
Scope: BibleQuest V6 release acceptance only
Decision owner: repository/release owner (explicit user authorization in the W2 execution session)

## Decision

Residual risk is **accepted temporarily for the current V6 release-candidate process** while Supabase project-level leaked-password protection remains disabled.

This decision does not assert that Supabase native leaked-password protection is enabled and does not waive the requirement permanently.

## Evidence and controls

- Live Supabase Security Advisor observation on 2026-10-02 JST reports `auth_leaked_password_protection` as WARN / `Leaked Password Protection Disabled`.
- BibleQuest first-party HIBP leaked-password screening is integrated and fails closed on malformed upstream responses (merged PR #1041).
- The acceptance evidence policy integrated by PR #1048 requires this explicit decision record when using the first-party equivalent rather than verified hosted Supabase protection.
- Existing server-side authorization, RLS, role checks, tenant isolation, and cross-congregation denial requirements remain unchanged.

## Residual risk

Direct or otherwise permitted Supabase Auth password-setting paths may not receive the same first-party HIBP screening unless they traverse the BibleQuest-controlled screening path. Native Supabase leaked-password protection therefore remains the preferred defense-in-depth configuration.

## Follow-up

Enable Supabase project-level leaked-password protection when operationally available, verify it with live Security Advisor evidence, and supersede this temporary acceptance. Do not treat this decision as authorization to weaken password screening, Auth controls, RLS, or tenant isolation.

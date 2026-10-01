# V6 leaked-password protection release gate

Updated: 2026-10-01 JST  
Scope: production Supabase Auth release verification  
Production mutation in this tranche: **none**

BibleQuest V6 has a dedicated acceptance row requiring leaked-password protection, or a separately approved equivalent/risk acceptance, before release.

Current live evidence from the connected production Supabase Security Advisor on 2026-10-01 reports **Leaked Password Protection Disabled**. The row therefore remains open.

Supabase documents the hosted control as `password_hibp_enabled`; when enabled, Supabase Auth rejects passwords known by Have I Been Pwned. The setting is available on supported paid plans and is read through the Management API at `GET /v1/projects/{ref}/config/auth`.

This tranche adds:

- `scripts/v6-auth-production-security.mjs`, which reads the production Auth configuration and fails closed unless `password_hibp_enabled === true`;
- `tests/v6/leaked-password-protection-release-gate.test.ts`, which locks the field, read-only request method, credential requirements, and non-leaking error behavior;
- `.github/workflows/v6-production-auth-security.yml`, a manual/reusable release gate that requires the repository secret `SUPABASE_ACCESS_TOKEN`.

The verification script never prints the access token or the full Auth configuration.

## Release use

1. Enable leaked-password protection in the BibleQuest production Supabase Auth settings.
2. Run **V6 Production Auth Security** on the exact RC ancestry.
3. Re-run the live Supabase Security Advisor and confirm the `auth_leaked_password_protection` warning is absent.
4. Only then reconcile the dedicated V6 acceptance row.

If the project deliberately chooses not to enable the control, the checklist permits an explicit residual-risk acceptance with rationale and compensating controls. This repository tranche does not make that product/security decision and does not convert a disabled setting into PASS.

-- BibleQuest V6 disposable database-CI release prerequisite overlay.
-- This is NOT a deployable production migration.
--
-- Some early V5 production migrations are present in hosted migration history
-- but their original SQL is no longer available one-to-one in this repository.
-- Later source-controlled hardening SQL assumes these released objects already
-- exist. Recreate only those prerequisites here, from read-only production
-- verification, before folding the available historical SQL into the synthetic
-- local baseline.

create table if not exists public.bible_congregation_invites (
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  code_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  max_uses integer not null default 100 check (max_uses >= 1 and max_uses <= 1000),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.bible_congregation_invites enable row level security;
revoke all on table public.bible_congregation_invites from anon, authenticated;

-- Admin/auth parity is provided by the existing idempotent
-- 20260905_admin_auth_schema_parity.sql and is injected ahead of historical
-- permission hardening by the V6 local-baseline builder.

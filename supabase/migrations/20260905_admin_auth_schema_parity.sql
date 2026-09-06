-- Source-control parity for BibleQuest admin/auth objects already present in production.
-- This migration is intentionally idempotent so existing production objects are not rebuilt.

create extension if not exists pgcrypto;

create table if not exists public.bible_app_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','leader','pastor','admin','owner')),
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bible_app_access_role_idx
  on public.bible_app_access(role) where active;
create index if not exists bible_app_access_granted_by_idx
  on public.bible_app_access(granted_by) where granted_by is not null;

alter table public.bible_app_access enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='bible_app_access' and policyname='app access read own'
  ) then
    create policy "app access read own" on public.bible_app_access
      for select to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;

create table if not exists public.bible_admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bible_admin_audit_actor_idx
  on public.bible_admin_audit_log(actor_id) where actor_id is not null;
create index if not exists bible_admin_audit_target_idx
  on public.bible_admin_audit_log(target_user_id) where target_user_id is not null;
create index if not exists bible_admin_audit_created_idx
  on public.bible_admin_audit_log(created_at desc);
alter table public.bible_admin_audit_log enable row level security;

-- Historical tables retained for production parity. Current browser signup/recovery does not
-- write these directly; the recovery-code flow is retired in favor of Supabase Auth email reset.
create table if not exists public.bible_password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  email_hash text not null
);
create index if not exists bible_password_reset_codes_user_idx on public.bible_password_reset_codes(user_id);
create index if not exists bible_password_reset_codes_requested_by_idx on public.bible_password_reset_codes(requested_by);
create index if not exists bible_password_reset_codes_expiry_idx on public.bible_password_reset_codes(expires_at);
create index if not exists bible_password_reset_codes_email_idx on public.bible_password_reset_codes(email_hash, created_at desc);
alter table public.bible_password_reset_codes enable row level security;

create table if not exists public.bible_signup_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (ip_hash, window_start)
);
create index if not exists bible_signup_limits_updated_idx on public.bible_signup_limits(updated_at);
alter table public.bible_signup_limits enable row level security;

-- Least-privilege grants are enforced separately by
-- 20260905_production_permission_hardening.sql.

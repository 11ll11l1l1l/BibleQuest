#!/usr/bin/env bash
set -euo pipefail

container="bq-avatar-postgres-${RANDOM}-${RANDOM}"
cleanup(){ docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --rm --name "$container" -e POSTGRES_PASSWORD=bqtest postgres:16-alpine >/dev/null
for _ in $(seq 1 40); do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$container" pg_isready -U postgres >/dev/null

docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres <<'SQL'
create role anon noinherit;
create role authenticated noinherit;
create schema auth;
create schema private;

grant usage on schema public, auth, private to authenticated;

create function auth.uid() returns uuid
language sql stable
as $$ select '11111111-1111-1111-1111-111111111111'::uuid $$;

create table public.bible_congregation_members(
  congregation_id uuid not null,
  user_id uuid not null,
  active boolean not null default true,
  avatar jsonb not null default '{"face":"smile","outfit":"traveler","companion":"sheep","background":"olive"}'::jsonb,
  primary key(congregation_id,user_id)
);
alter table public.bible_congregation_members enable row level security;

create function private.is_bible_congregation_member(target_congregation uuid)
returns boolean
language sql stable security definer set search_path=''
as $$
  select exists(
    select 1 from public.bible_congregation_members m
    where m.congregation_id=target_congregation
      and m.user_id=(select auth.uid())
      and m.active
  )
$$;
revoke all on function private.is_bible_congregation_member(uuid) from public;
grant execute on function private.is_bible_congregation_member(uuid) to authenticated;

create policy "members congregation read"
on public.bible_congregation_members for select to authenticated
using (private.is_bible_congregation_member(congregation_id));

-- Reproduce the broader pre-correction policy from the frozen v3.55 migration.
create policy "members self avatar update"
on public.bible_congregation_members for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

grant select on public.bible_congregation_members to authenticated;
grant update(avatar) on public.bible_congregation_members to authenticated;

create table public.bible_avatar_cosmetics(
  user_id uuid primary key,
  selected_style text not null default 'starter',
  updated_at timestamptz not null default now()
);
alter table public.bible_avatar_cosmetics enable row level security;
create policy "avatar cosmetics own read" on public.bible_avatar_cosmetics
  for select to authenticated using (user_id=(select auth.uid()));
create policy "avatar cosmetics own insert" on public.bible_avatar_cosmetics
  for insert to authenticated with check (user_id=(select auth.uid()));
create policy "avatar cosmetics own update" on public.bible_avatar_cosmetics
  for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
grant select,insert,update on public.bible_avatar_cosmetics to authenticated;

insert into public.bible_congregation_members(congregation_id,user_id,avatar)
values(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '{"face":"smile","outfit":"traveler","companion":"sheep","background":"olive"}'::jsonb
);
SQL

# Apply the real repository correction to the minimal faithful schema.
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres < supabase/migrations/20260910_avatar_vault_integrity_reconcile.sql

docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres <<'SQL'
set role authenticated;

-- A cosmetic-only compatibility update must preserve the base avatar fields.
update public.bible_congregation_members
set avatar='{"cosmetic":"lantern"}'::jsonb
where congregation_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and user_id='11111111-1111-1111-1111-111111111111';

do $$
declare a jsonb;
begin
  select avatar into a from public.bible_congregation_members
  where congregation_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    and user_id='11111111-1111-1111-1111-111111111111';
  if a->>'face' <> 'smile' or a->>'outfit' <> 'traveler' or a->>'companion' <> 'sheep'
     or a->>'background' <> 'olive' or a->>'cosmetic' <> 'lantern' then
    raise exception 'cosmetic-only update destroyed or failed to preserve avatar fields: %', a;
  end if;
end $$;

-- The cosmetics upsert must transactionally project the public cosmetic while
-- preserving the same base object.
insert into public.bible_avatar_cosmetics(user_id,selected_style)
values('11111111-1111-1111-1111-111111111111','crown')
on conflict(user_id) do update set selected_style=excluded.selected_style,updated_at=now();

do $$
declare a jsonb;
begin
  select avatar into a from public.bible_congregation_members
  where congregation_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    and user_id='11111111-1111-1111-1111-111111111111';
  if a->>'face' <> 'smile' or a->>'outfit' <> 'traveler' or a->>'companion' <> 'sheep'
     or a->>'background' <> 'olive' or a->>'cosmetic' <> 'crown' then
    raise exception 'cosmetics projection failed or destroyed avatar fields: %', a;
  end if;
end $$;

reset role;

-- Force the projection side to fail. The source cosmetics upsert must roll back
-- to the previous value rather than commit a private/public split.
create function public.bq_reject_broken_avatar() returns trigger
language plpgsql
as $$
begin
  if new.avatar->>'cosmetic'='broken' then
    raise exception 'forced projection failure';
  end if;
  return new;
end $$;
create trigger bq_reject_broken_avatar
before update of avatar on public.bible_congregation_members
for each row execute function public.bq_reject_broken_avatar();

set role authenticated;
do $$
declare current_style text; current_cosmetic text;
begin
  begin
    insert into public.bible_avatar_cosmetics(user_id,selected_style)
    values('11111111-1111-1111-1111-111111111111','broken')
    on conflict(user_id) do update set selected_style=excluded.selected_style,updated_at=now();
    raise exception 'expected projection failure did not occur';
  exception when others then
    if sqlerrm='expected projection failure did not occur' then raise; end if;
  end;

  select selected_style into current_style from public.bible_avatar_cosmetics
  where user_id='11111111-1111-1111-1111-111111111111';
  select avatar->>'cosmetic' into current_cosmetic from public.bible_congregation_members
  where congregation_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    and user_id='11111111-1111-1111-1111-111111111111';
  if current_style <> 'crown' or current_cosmetic <> 'crown' then
    raise exception 'projection failure committed split state: selection %, public %',current_style,current_cosmetic;
  end if;
end $$;
reset role;

do $$
begin
  if exists(select 1 from pg_policies where schemaname='public' and tablename='bible_congregation_members' and policyname='members self avatar update') then
    raise exception 'redundant broad members self avatar update policy survived correction';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='bible_congregation_members' and policyname='members update own public profile') then
    raise exception 'membership-qualified public-profile update policy missing';
  end if;
end $$;
SQL

echo "BibleQuest v3 Avatar Vault PostgreSQL integrity regression passed."

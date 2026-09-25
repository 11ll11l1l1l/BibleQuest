-- V6 telemetry privacy hardening.
-- Reject exact Scripture locations and sensitive/free-form property values server-side.
-- Derived from the integrated telemetry hardening function to avoid duplicated function fragments.

create index if not exists bible_telemetry_events_session_idx
  on public.bible_telemetry_events (session_id);
create index if not exists bible_telemetry_sessions_started_user_idx
  on public.bible_telemetry_sessions (started_user_id)
  where started_user_id is not null;
create index if not exists bible_telemetry_visitors_first_user_idx
  on public.bible_telemetry_visitors (first_user_id)
  where first_user_id is not null;
create index if not exists bible_telemetry_visitors_last_user_idx
  on public.bible_telemetry_visitors (last_user_id)
  where last_user_id is not null;

create or replace function public.bible_record_telemetry_batch(
  p_visitor_id uuid,
  p_session_id uuid,
  p_events jsonb default '[]'::jsonb,
  p_context jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $bqtelemetry$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_headers jsonb := '{}'::jsonb;
  v_ip text := 'unknown';
  v_rate_key text;
  v_rate_count integer := 0;
  v_platform text := 'unknown';
  v_locale text := 'unknown';
  v_app_version text := 'v6';
  v_screen_bucket text := 'unknown';
  v_is_pwa boolean := false;
  v_entry_route text := 'home';
  v_last_route text := 'home';
  v_event jsonb;
  v_name text;
  v_feature text;
  v_route text;
  v_props jsonb;
  v_accepted integer := 0;
  v_requested integer := 0;
  v_has_session_start boolean := false;
  v_has_session_end boolean := false;
begin
  if p_visitor_id is null or p_session_id is null then raise exception 'visitor_id and session_id are required'; end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' then raise exception 'events must be a JSON array'; end if;
  v_requested := jsonb_array_length(p_events);
  if v_requested > 25 then raise exception 'telemetry batch exceeds 25 events'; end if;
  if p_context is null or jsonb_typeof(p_context) <> 'object' then p_context := '{}'::jsonb; end if;

  begin
    v_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  exception when others then
    v_headers := '{}'::jsonb;
  end;
  v_ip := split_part(coalesce(v_headers->>'x-forwarded-for', 'unknown'), ',', 1);
  v_rate_key := md5(v_ip || ':' || to_char(v_now at time zone 'UTC', 'YYYY-MM-DD HH24:MI'));
  insert into private.bible_telemetry_rate_limits(rate_key, window_start, request_count)
  values (v_rate_key, date_trunc('minute', v_now), 1)
  on conflict (rate_key) do update set request_count = private.bible_telemetry_rate_limits.request_count + 1
  returning request_count into v_rate_count;
  if v_rate_count > 180 then raise exception 'telemetry rate limit exceeded'; end if;

  if coalesce(p_context->>'platform','') ~ '^[A-Za-z0-9 ._/-]{1,40}$' then v_platform := p_context->>'platform'; end if;
  if coalesce(p_context->>'locale','') ~ '^[A-Za-z0-9_-]{1,24}$' then v_locale := p_context->>'locale'; end if;
  if coalesce(p_context->>'app_version','') ~ '^[A-Za-z0-9._+-]{1,40}$' then v_app_version := p_context->>'app_version'; end if;
  if coalesce(p_context->>'screen_bucket','') = any(array['xs','sm','md','lg','xl','unknown']) then v_screen_bucket := p_context->>'screen_bucket'; end if;
  v_is_pwa := lower(coalesce(p_context->>'is_pwa','false')) in ('true','1','yes');

  if v_requested > 0 then
    v_event := p_events->0;
    if coalesce(v_event->>'route','') ~ '^[A-Za-z0-9._/-]{1,80}$' then v_entry_route := left(v_event->>'route',80); end if;
    v_last_route := v_entry_route;
  end if;

  insert into public.bible_telemetry_visitors(visitor_id,first_seen_at,last_seen_at,first_route,last_route,platform,locale,app_version,is_pwa,screen_bucket,first_user_id,last_user_id)
  values(p_visitor_id,v_now,v_now,v_entry_route,v_entry_route,v_platform,v_locale,v_app_version,v_is_pwa,v_screen_bucket,v_user_id,v_user_id)
  on conflict (visitor_id) do update set
    last_seen_at=excluded.last_seen_at,last_route=excluded.last_route,platform=excluded.platform,locale=excluded.locale,
    app_version=excluded.app_version,is_pwa=excluded.is_pwa,screen_bucket=excluded.screen_bucket,
    first_user_id=coalesce(public.bible_telemetry_visitors.first_user_id,excluded.first_user_id),
    last_user_id=coalesce(excluded.last_user_id,public.bible_telemetry_visitors.last_user_id);

  insert into public.bible_telemetry_sessions(session_id,visitor_id,started_user_id,user_id,started_at,last_seen_at,authenticated_at,entry_route,last_route,platform,locale,app_version,is_pwa,screen_bucket)
  values(p_session_id,p_visitor_id,v_user_id,v_user_id,v_now,v_now,case when v_user_id is not null then v_now else null end,v_entry_route,v_entry_route,v_platform,v_locale,v_app_version,v_is_pwa,v_screen_bucket)
  on conflict (session_id) do update set
    last_seen_at=excluded.last_seen_at,
    user_id=coalesce(excluded.user_id,public.bible_telemetry_sessions.user_id),
    authenticated_at=coalesce(public.bible_telemetry_sessions.authenticated_at,case when excluded.user_id is not null then excluded.last_seen_at else null end),
    last_route=excluded.last_route,platform=excluded.platform,locale=excluded.locale,app_version=excluded.app_version,is_pwa=excluded.is_pwa,screen_bucket=excluded.screen_bucket;

  for v_event in select value from jsonb_array_elements(p_events) limit 25 loop
    v_name := lower(trim(coalesce(v_event->>'event_name','')));
    if v_name !~ '^[a-z0-9][a-z0-9._-]{0,63}$' then continue; end if;
    v_feature := lower(trim(coalesce(v_event->>'feature','app')));
    if v_feature !~ '^[a-z0-9][a-z0-9._/-]{0,79}$' then v_feature := 'app'; end if;
    v_route := lower(trim(coalesce(v_event->>'route',v_feature)));
    if v_route !~ '^[a-z0-9][a-z0-9._/-]{0,79}$' then v_route := v_feature; end if;
    v_last_route := v_route;

    select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into v_props
    from jsonb_each(case when jsonb_typeof(v_event->'properties')='object' then v_event->'properties' else '{}'::jsonb end)
    where key=any(array['action','element','source','status','result','error_name','visibility','install_state','offline','duration_bucket','count','content_type','difficulty','completion','reason_code','language','role','assignment_type','game','mode'])
      and (
        jsonb_typeof(value) in ('boolean','null')
        or (
          jsonb_typeof(value)='number'
          and abs((value #>> '{}')::numeric) <= 1000000000
        )
        or (
          jsonb_typeof(value)='string'
          and char_length(value #>> '{}') <= 120
          and (value #>> '{}') ~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}

    insert into public.bible_telemetry_events(visitor_id,session_id,user_id,event_name,feature,route,properties,occurred_at)
    values(p_visitor_id,p_session_id,v_user_id,v_name,v_feature,v_route,v_props,v_now);
    v_accepted := v_accepted + 1;
    if v_name='session_start' then v_has_session_start := true; end if;
    if v_name='session_end' then v_has_session_end := true; end if;
  end loop;

  update public.bible_telemetry_sessions set
    last_seen_at=v_now,last_route=v_last_route,event_count=event_count+v_accepted,
    ended_at=case when v_has_session_start then null when v_has_session_end then v_now else ended_at end,
    user_id=coalesce(v_user_id,user_id),
    authenticated_at=coalesce(authenticated_at,case when v_user_id is not null then v_now else null end)
  where session_id=p_session_id;

  update public.bible_telemetry_visitors set last_seen_at=v_now,last_route=v_last_route,last_user_id=coalesce(v_user_id,last_user_id)
  where visitor_id=p_visitor_id;

  return jsonb_build_object('ok',true,'accepted',v_accepted,'requested',v_requested,'authenticated',v_user_id is not null);
end;
$bqtelemetry$;

revoke all on function public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb) to anon, authenticated, service_role;

          and (value #>> '{}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

    insert into public.bible_telemetry_events(visitor_id,session_id,user_id,event_name,feature,route,properties,occurred_at)
    values(p_visitor_id,p_session_id,v_user_id,v_name,v_feature,v_route,v_props,v_now);
    v_accepted := v_accepted + 1;
    if v_name='session_start' then v_has_session_start := true; end if;
    if v_name='session_end' then v_has_session_end := true; end if;
  end loop;

  update public.bible_telemetry_sessions set
    last_seen_at=v_now,last_route=v_last_route,event_count=event_count+v_accepted,
    ended_at=case when v_has_session_start then null when v_has_session_end then v_now else ended_at end,
    user_id=coalesce(v_user_id,user_id),
    authenticated_at=coalesce(authenticated_at,case when v_user_id is not null then v_now else null end)
  where session_id=p_session_id;

  update public.bible_telemetry_visitors set last_seen_at=v_now,last_route=v_last_route,last_user_id=coalesce(v_user_id,last_user_id)
  where visitor_id=p_visitor_id;

  return jsonb_build_object('ok',true,'accepted',v_accepted,'requested',v_requested,'authenticated',v_user_id is not null);
end;
$bqtelemetry$;

revoke all on function public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb) to anon, authenticated, service_role;

          and position('@' in (value #>> '{}')) = 0
        )
      );

    insert into public.bible_telemetry_events(visitor_id,session_id,user_id,event_name,feature,route,properties,occurred_at)
    values(p_visitor_id,p_session_id,v_user_id,v_name,v_feature,v_route,v_props,v_now);
    v_accepted := v_accepted + 1;
    if v_name='session_start' then v_has_session_start := true; end if;
    if v_name='session_end' then v_has_session_end := true; end if;
  end loop;

  update public.bible_telemetry_sessions set
    last_seen_at=v_now,last_route=v_last_route,event_count=event_count+v_accepted,
    ended_at=case when v_has_session_start then null when v_has_session_end then v_now else ended_at end,
    user_id=coalesce(v_user_id,user_id),
    authenticated_at=coalesce(authenticated_at,case when v_user_id is not null then v_now else null end)
  where session_id=p_session_id;

  update public.bible_telemetry_visitors set last_seen_at=v_now,last_route=v_last_route,last_user_id=coalesce(v_user_id,last_user_id)
  where visitor_id=p_visitor_id;

  return jsonb_build_object('ok',true,'accepted',v_accepted,'requested',v_requested,'authenticated',v_user_id is not null);
end;
$bqtelemetry$;

revoke all on function public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb) to anon, authenticated, service_role;


comment on function public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb) is
  'Write-only V6 telemetry endpoint. Event/property names and values are bounded; property strings are token-only; UUID/email-like values and exact Scripture location properties are rejected; authenticated identity is derived only from auth.uid().';

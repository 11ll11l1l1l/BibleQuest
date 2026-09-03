-- BibleQuest cloud-stage additions.
-- Apply after supabase/schema.sql on a DEDICATED BibleQuest project only.
-- This file deliberately grants no browser access to invite-code records.

create table if not exists public.bible_congregation_invites (
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  code_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  max_uses integer not null default 100 check (max_uses between 1 and 1000),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists bible_congregation_invites_congregation_idx
  on public.bible_congregation_invites (congregation_id, active, expires_at);

alter table public.bible_congregation_invites enable row level security;
revoke all on public.bible_congregation_invites from anon, authenticated;
grant all on public.bible_congregation_invites to service_role;

-- RLS on bible_score_events remains authoritative because this function is SECURITY INVOKER.
-- It returns server-side aggregates so the browser never needs to download the entire event history.
create or replace function public.bible_leaderboard(
  p_congregation uuid,
  p_since timestamptz default null
)
returns table(user_id uuid, category text, points bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.user_id, e.category, sum(e.points)::bigint as points
  from public.bible_score_events e
  where e.congregation_id = p_congregation
    and (p_since is null or e.created_at >= p_since)
  group by e.user_id, e.category;
$$;

revoke all on function public.bible_leaderboard(uuid,timestamptz) from public, anon;
grant execute on function public.bible_leaderboard(uuid,timestamptz) to authenticated, service_role;

-- Cloud badges are derived from trusted score events. They complement the richer local learning badges.
insert into public.bible_badge_catalog (id,icon,name,category,description,threshold,active) values
('cloud_total_50','🌱','Cloud First Steps','Progress','Earn 50 trusted congregation points','{"metric":"total_points","value":50}'::jsonb,true),
('cloud_total_100','⭐','Cloud Century','Progress','Earn 100 trusted congregation points','{"metric":"total_points","value":100}'::jsonb,true),
('cloud_total_250','⚡','Active Learner','Progress','Earn 250 trusted congregation points','{"metric":"total_points","value":250}'::jsonb,true),
('cloud_total_500','🔥','Growing Light','Progress','Earn 500 trusted congregation points','{"metric":"total_points","value":500}'::jsonb,true),
('cloud_total_1000','🏆','Thousand Point Journey','Progress','Earn 1,000 trusted congregation points','{"metric":"total_points","value":1000}'::jsonb,true),
('cloud_total_2500','👑','Congregation Builder','Progress','Earn 2,500 trusted congregation points','{"metric":"total_points","value":2500}'::jsonb,true),
('cloud_total_5000','🌟','Long Journey','Progress','Earn 5,000 trusted congregation points','{"metric":"total_points","value":5000}'::jsonb,true),

('cloud_knowledge_50','🧠','Knowledge Starter','Knowledge','Earn 50 Knowledge points','{"metric":"category_points","category":"knowledge","value":50}'::jsonb,true),
('cloud_knowledge_100','📚','Knowledge 100','Knowledge','Earn 100 Knowledge points','{"metric":"category_points","category":"knowledge","value":100}'::jsonb,true),
('cloud_knowledge_250','🎓','Growing Scholar','Knowledge','Earn 250 Knowledge points','{"metric":"category_points","category":"knowledge","value":250}'::jsonb,true),
('cloud_knowledge_500','🏛️','Scripture Scholar','Knowledge','Earn 500 Knowledge points','{"metric":"category_points","category":"knowledge","value":500}'::jsonb,true),
('cloud_knowledge_1000','💎','Knowledge Keeper','Knowledge','Earn 1,000 Knowledge points','{"metric":"category_points","category":"knowledge","value":1000}'::jsonb,true),

('cloud_reading_25','📖','Reading Starter','Reading','Earn 25 Reading points','{"metric":"category_points","category":"reading","value":25}'::jsonb,true),
('cloud_reading_100','📘','Page Walker','Reading','Earn 100 Reading points','{"metric":"category_points","category":"reading","value":100}'::jsonb,true),
('cloud_reading_250','📚','Library Walker','Reading','Earn 250 Reading points','{"metric":"category_points","category":"reading","value":250}'::jsonb,true),
('cloud_reading_500','🗃️','Scripture Explorer','Reading','Earn 500 Reading points','{"metric":"category_points","category":"reading","value":500}'::jsonb,true),

('cloud_wisdom_20','🧭','Wisdom Starter','Wisdom','Earn 20 Wisdom points','{"metric":"category_points","category":"wisdom","value":20}'::jsonb,true),
('cloud_wisdom_50','🌿','Thoughtful Learner','Wisdom','Earn 50 Wisdom points','{"metric":"category_points","category":"wisdom","value":50}'::jsonb,true),
('cloud_wisdom_100','🌳','Wisdom Builder','Wisdom','Earn 100 Wisdom points','{"metric":"category_points","category":"wisdom","value":100}'::jsonb,true),
('cloud_wisdom_250','🪴','Wise Practice','Wisdom','Earn 250 Wisdom points','{"metric":"category_points","category":"wisdom","value":250}'::jsonb,true),

('cloud_mastery_20','🗺️','Mastery Trail','Mastery','Earn 20 Mastery points','{"metric":"category_points","category":"mastery","value":20}'::jsonb,true),
('cloud_mastery_50','⛰️','Mastery Climber','Mastery','Earn 50 Mastery points','{"metric":"category_points","category":"mastery","value":50}'::jsonb,true),
('cloud_mastery_100','🏔️','Mastery Builder','Mastery','Earn 100 Mastery points','{"metric":"category_points","category":"mastery","value":100}'::jsonb,true),
('cloud_mastery_250','🏁','Mastery Keeper','Mastery','Earn 250 Mastery points','{"metric":"category_points","category":"mastery","value":250}'::jsonb,true),

('cloud_consistency_9','🔥','Three Sparks','Consistency','Earn 9 Consistency points','{"metric":"category_points","category":"consistency","value":9}'::jsonb,true),
('cloud_consistency_21','🕯️','Week Rhythm','Consistency','Earn 21 Consistency points','{"metric":"category_points","category":"consistency","value":21}'::jsonb,true),
('cloud_consistency_60','🌤️','Steady Rhythm','Consistency','Earn 60 Consistency points','{"metric":"category_points","category":"consistency","value":60}'::jsonb,true),
('cloud_consistency_120','🌞','Long Rhythm','Consistency','Earn 120 Consistency points','{"metric":"category_points","category":"consistency","value":120}'::jsonb,true),

('cloud_group_10','👥','Joined the Circle','Community','Earn 10 Group points','{"metric":"category_points","category":"group","value":10}'::jsonb,true),
('cloud_group_50','🫶','Community Regular','Community','Earn 50 Group points','{"metric":"category_points","category":"group","value":50}'::jsonb,true),
('cloud_group_100','🏘️','Table Builder','Community','Earn 100 Group points','{"metric":"category_points","category":"group","value":100}'::jsonb,true),
('cloud_group_250','⛪','Community Pillar','Community','Earn 250 Group points','{"metric":"category_points","category":"group","value":250}'::jsonb,true),

('cloud_couples_10','💞','Together Starter','Couples','Earn 10 Couples points','{"metric":"category_points","category":"couples","value":10}'::jsonb,true),
('cloud_couples_50','💛','Growing Together','Couples','Earn 50 Couples points','{"metric":"category_points","category":"couples","value":50}'::jsonb,true),
('cloud_couples_100','🤝','Strong Table','Couples','Earn 100 Couples points','{"metric":"category_points","category":"couples","value":100}'::jsonb,true),
('cloud_couples_250','🏡','Long Conversation','Couples','Earn 250 Couples points','{"metric":"category_points","category":"couples","value":250}'::jsonb,true),

('cloud_events_10','🔟','Ten Activities','Progress','Record 10 trusted activities','{"metric":"event_count","value":10}'::jsonb,true),
('cloud_events_50','5️⃣','Fifty Activities','Progress','Record 50 trusted activities','{"metric":"event_count","value":50}'::jsonb,true),
('cloud_events_100','💯','Hundred Activities','Progress','Record 100 trusted activities','{"metric":"event_count","value":100}'::jsonb,true),
('cloud_events_250','🏅','250 Activities','Progress','Record 250 trusted activities','{"metric":"event_count","value":250}'::jsonb,true),
('cloud_events_500','🎖️','500 Activities','Progress','Record 500 trusted activities','{"metric":"event_count","value":500}'::jsonb,true),

('cloud_group_events_5','🎮','Team Player','Community','Record 5 trusted group activities','{"metric":"category_events","category":"group","value":5}'::jsonb,true),
('cloud_group_events_10','🎯','Group Regular','Community','Record 10 trusted group activities','{"metric":"category_events","category":"group","value":10}'::jsonb,true),
('cloud_group_events_25','🧩','Group Builder','Community','Record 25 trusted group activities','{"metric":"category_events","category":"group","value":25}'::jsonb,true),
('cloud_couple_events_5','💬','Five Good Talks','Couples','Record 5 trusted couples activities','{"metric":"category_events","category":"couples","value":5}'::jsonb,true),
('cloud_couple_events_10','👂','Couples Regular','Couples','Record 10 trusted couples activities','{"metric":"category_events","category":"couples","value":10}'::jsonb,true),
('cloud_couple_events_25','🪢','Keep Showing Up','Couples','Record 25 trusted couples activities','{"metric":"category_events","category":"couples","value":25}'::jsonb,true)
on conflict (id) do update set
  icon=excluded.icon,
  name=excluded.name,
  category=excluded.category,
  description=excluded.description,
  threshold=excluded.threshold,
  active=excluded.active;

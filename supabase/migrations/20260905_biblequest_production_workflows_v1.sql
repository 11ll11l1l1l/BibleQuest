-- BibleQuest production workflows v1.
create or replace function public.bible_poll_aggregate_v2(p_poll uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p record;r text;out jsonb;opts jsonb;i int;total int;score numeric;
begin
 select * into p from public.bible_polls where id=p_poll;
 if p.id is null or not private.is_bible_congregation_member(p.congregation_id) then return '[]'::jsonb; end if;
 r:=private.bible_role_in_congregation(p.congregation_id);
 if p.results_visibility='leader_only' and r<>all(array['facilitator','leader','pastor','admin']) then return '[]'::jsonb; end if;
 if p.results_visibility='hidden_until_close' and (p.closes_at is null or p.closes_at>now()) and r<>all(array['facilitator','leader','pastor','admin']) then return '[]'::jsonb; end if;
 opts:=coalesce(p.options,'[]'::jsonb);out:='[]'::jsonb;
 if p.poll_type in('single','yes_no','discussion') then
   for i in 0..greatest(jsonb_array_length(opts)-1,-1) loop select count(*) into total from public.bible_poll_votes where poll_id=p_poll and option_index=i;out:=out||jsonb_build_array(jsonb_build_object('option_index',i,'label',opts->>i,'total',total,'score',total));end loop;
 elsif p.poll_type='multi' then
   for i in 0..greatest(jsonb_array_length(opts)-1,-1) loop select count(*) into total from public.bible_poll_responses where poll_id=p_poll and coalesce(response->'choices','[]'::jsonb)@>jsonb_build_array(i);out:=out||jsonb_build_array(jsonb_build_object('option_index',i,'label',opts->>i,'total',total,'score',total));end loop;
 elsif p.poll_type='ranked' then
   for i in 0..greatest(jsonb_array_length(opts)-1,-1) loop select coalesce(sum(greatest(jsonb_array_length(opts)-x.ord+1,0)),0)::numeric into score from public.bible_poll_responses pr cross join lateral jsonb_array_elements_text(coalesce(pr.response->'rank','[]'::jsonb)) with ordinality x(val,ord) where pr.poll_id=p_poll and x.val::int=i;select count(*) into total from public.bible_poll_responses pr where pr.poll_id=p_poll and(pr.response->'rank'->>0)::int=i;out:=out||jsonb_build_array(jsonb_build_object('option_index',i,'label',opts->>i,'total',total,'score',score));end loop;
 end if;return out;
end $$;
revoke all on function public.bible_poll_aggregate_v2(uuid) from public,anon;grant execute on function public.bible_poll_aggregate_v2(uuid) to authenticated,service_role;

drop policy if exists "ministry messages congregation read" on public.bible_ministry_messages;
create policy "ministry messages congregation read" on public.bible_ministry_messages for select to authenticated using(active and private.is_bible_congregation_member(congregation_id) and((publish_at<=now() and(expires_at is null or expires_at>now())) or private.bible_role_in_congregation(congregation_id)=any(array['facilitator','leader','pastor','admin'])));
drop policy if exists "polls congregation read" on public.bible_polls;
create policy "polls congregation read" on public.bible_polls for select to authenticated using(active and private.is_bible_congregation_member(congregation_id) and(scheduled_at is null or scheduled_at<=now() or private.bible_role_in_congregation(congregation_id)=any(array['facilitator','leader','pastor','admin'])));
drop policy if exists "assignments visible members" on public.bible_assignments;
create policy "assignments visible members" on public.bible_assignments for select to authenticated using(active and private.bible_assignment_visible(congregation_id,target_scope,target_id) and(schedule_at is null or schedule_at<=now() or private.bible_role_in_congregation(congregation_id)=any(array['facilitator','leader','pastor','admin'])));

create or replace function public.bq_notify_congregation_members() returns trigger language plpgsql security definer set search_path=public as $$
declare r record;
begin
 if tg_table_name='bible_ministry_messages' then
  if new.active is not true or new.publish_at>now() then return new;end if;
  for r in select user_id from public.bible_congregation_members where congregation_id=new.congregation_id and active loop if r.user_id is distinct from new.created_by then insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(r.user_id,new.congregation_id,new.created_by,new.message_type,new.title,left(new.body,300),'ministry',jsonb_build_object('message_id',new.id));end if;end loop;
 elsif tg_table_name='bible_polls' then
  if new.active is not true or(new.scheduled_at is not null and new.scheduled_at>now()) then return new;end if;
  for r in select user_id from public.bible_congregation_members where congregation_id=new.congregation_id and active loop if r.user_id is distinct from new.created_by then insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(r.user_id,new.congregation_id,new.created_by,'poll','New congregation poll',left(new.prompt,240),'ministry',jsonb_build_object('poll_id',new.id));end if;end loop;
 elsif tg_table_name='bible_member_recognitions' then insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(new.user_id,new.congregation_id,new.awarded_by,'award',new.title,coalesce(new.note,''),'recognition',jsonb_build_object('recognition_id',new.id));
 end if;return new;
end $$;
create or replace function public.bq_notify_assignment() returns trigger language plpgsql security definer set search_path=public as $$
declare r record;
begin
 if new.active is not true then return new;end if;
 if new.target_scope='member' and new.target_id is not null then insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(new.target_id,new.congregation_id,new.created_by,'assignment','New assignment: '||new.title,left(new.instructions,300),'assignment',jsonb_build_object('assignment_id',new.id));
 elsif new.target_scope='team' and new.target_id is not null then for r in select tm.user_id from public.bible_team_members tm join public.bible_congregation_members cm on cm.user_id=tm.user_id and cm.congregation_id=new.congregation_id and cm.active where tm.team_id=new.target_id loop if r.user_id is distinct from new.created_by then insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(r.user_id,new.congregation_id,new.created_by,'assignment','New assignment: '||new.title,left(new.instructions,300),'assignment',jsonb_build_object('assignment_id',new.id));end if;end loop;
 elsif new.target_scope='group' and new.target_id is not null then for r in select gm.user_id from public.bible_group_members gm join public.bible_congregation_members cm on cm.user_id=gm.user_id and cm.congregation_id=new.congregation_id and cm.active where gm.group_id=new.target_id and gm.active loop if r.user_id is distinct from new.created_by then insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(r.user_id,new.congregation_id,new.created_by,'assignment','New assignment: '||new.title,left(new.instructions,300),'assignment',jsonb_build_object('assignment_id',new.id));end if;end loop;
 else for r in select user_id from public.bible_congregation_members where congregation_id=new.congregation_id and active loop if r.user_id is distinct from new.created_by then insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(r.user_id,new.congregation_id,new.created_by,'assignment','New assignment: '||new.title,left(new.instructions,300),'assignment',jsonb_build_object('assignment_id',new.id));end if;end loop;end if;return new;
end $$;
create or replace function public.bq_notify_assignment_feedback() returns trigger language plpgsql security definer set search_path=public as $$
declare a record;begin if new.leader_feedback is distinct from old.leader_feedback and coalesce(new.leader_feedback,'')<>'' then select congregation_id,title,created_by into a from public.bible_assignments where id=new.assignment_id;insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload) values(new.user_id,a.congregation_id,a.created_by,'feedback','Leader feedback: '||a.title,left(new.leader_feedback,300),'assignment',jsonb_build_object('assignment_id',new.assignment_id));end if;return new;end $$;
drop trigger if exists trg_bq_notify_message on public.bible_ministry_messages;create trigger trg_bq_notify_message after insert on public.bible_ministry_messages for each row execute function public.bq_notify_congregation_members();
drop trigger if exists trg_bq_notify_poll on public.bible_polls;create trigger trg_bq_notify_poll after insert on public.bible_polls for each row execute function public.bq_notify_congregation_members();
drop trigger if exists trg_bq_notify_recognition on public.bible_member_recognitions;create trigger trg_bq_notify_recognition after insert on public.bible_member_recognitions for each row execute function public.bq_notify_congregation_members();
drop trigger if exists trg_bq_notify_assignment on public.bible_assignments;create trigger trg_bq_notify_assignment after insert on public.bible_assignments for each row execute function public.bq_notify_assignment();
drop trigger if exists trg_bq_notify_assignment_feedback on public.bible_assignment_progress;create trigger trg_bq_notify_assignment_feedback after update of leader_feedback on public.bible_assignment_progress for each row execute function public.bq_notify_assignment_feedback();
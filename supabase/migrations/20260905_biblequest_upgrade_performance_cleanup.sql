create index if not exists bible_account_deletion_requests_resolved_by_idx on public.bible_account_deletion_requests(resolved_by);
create index if not exists bible_client_errors_congregation_idx on public.bible_client_errors(congregation_id);
create index if not exists bible_client_errors_user_idx on public.bible_client_errors(user_id);
create index if not exists bible_content_escalations_raised_by_idx on public.bible_content_escalations(raised_by);
create index if not exists bible_content_escalations_resolved_by_idx on public.bible_content_escalations(resolved_by);
create index if not exists bible_media_library_created_by_idx on public.bible_media_library(created_by);
create index if not exists bible_member_recognitions_awarded_by_idx on public.bible_member_recognitions(awarded_by);
create index if not exists bible_member_recognitions_user_idx on public.bible_member_recognitions(user_id);
create index if not exists bible_ministry_calendar_created_by_idx on public.bible_ministry_calendar(created_by);
create index if not exists bible_notifications_congregation_idx on public.bible_notifications(congregation_id);
create index if not exists bible_notifications_created_by_idx on public.bible_notifications(created_by);
create index if not exists bible_poll_responses_user_idx on public.bible_poll_responses(user_id);

drop policy if exists "deletion requests own insert" on public.bible_account_deletion_requests;
create policy "deletion requests own insert" on public.bible_account_deletion_requests for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists "deletion requests own read" on public.bible_account_deletion_requests;
create policy "deletion requests own read" on public.bible_account_deletion_requests for select to authenticated using (user_id=(select auth.uid()));

drop policy if exists "users report own client errors" on public.bible_client_errors;
create policy "users report own client errors" on public.bible_client_errors for insert to authenticated with check (user_id=(select auth.uid()));

drop policy if exists "reviewers create escalations" on public.bible_content_escalations;
create policy "reviewers create escalations" on public.bible_content_escalations for insert to authenticated with check (raised_by=(select auth.uid()) and private.bible_role_in_congregation(congregation_id) in ('leader','pastor','admin'));

drop policy if exists "media ministry insert" on public.bible_media_library;
create policy "media ministry insert" on public.bible_media_library for insert to authenticated with check (created_by=(select auth.uid()) and private.bible_can_review_content(congregation_id));

drop policy if exists "leaders create recognitions" on public.bible_member_recognitions;
create policy "leaders create recognitions" on public.bible_member_recognitions for insert to authenticated with check (
  awarded_by=(select auth.uid()) and private.bible_role_in_congregation(congregation_id) in ('leader','pastor','admin') and exists(select 1 from public.bible_congregation_members m where m.congregation_id=bible_member_recognitions.congregation_id and m.user_id=bible_member_recognitions.user_id and m.active)
);

drop policy if exists "leaders create calendar" on public.bible_ministry_calendar;
create policy "leaders create calendar" on public.bible_ministry_calendar for insert to authenticated with check (created_by=(select auth.uid()) and private.bible_role_in_congregation(congregation_id) in ('facilitator','leader','pastor','admin'));

drop policy if exists "notifications own read" on public.bible_notifications;
create policy "notifications own read" on public.bible_notifications for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "notifications own update" on public.bible_notifications;
create policy "notifications own update" on public.bible_notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "leaders create notifications" on public.bible_notifications;
create policy "leaders create notifications" on public.bible_notifications for insert to authenticated with check (
  created_by=(select auth.uid()) and congregation_id is not null and private.bible_role_in_congregation(congregation_id) in ('facilitator','leader','pastor','admin') and exists(select 1 from public.bible_congregation_members m where m.congregation_id=bible_notifications.congregation_id and m.user_id=bible_notifications.user_id and m.active)
);

drop policy if exists "poll responses own read" on public.bible_poll_responses;
create policy "poll responses own read" on public.bible_poll_responses for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "poll responses own insert" on public.bible_poll_responses;
create policy "poll responses own insert" on public.bible_poll_responses for insert to authenticated with check (
  user_id=(select auth.uid()) and exists(select 1 from public.bible_polls p where p.id=bible_poll_responses.poll_id and p.active and private.is_bible_congregation_member(p.congregation_id))
);
drop policy if exists "poll responses own update" on public.bible_poll_responses;
create policy "poll responses own update" on public.bible_poll_responses for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

drop policy if exists "learning profile own read" on public.bible_user_learning_profile;
create policy "learning profile own read" on public.bible_user_learning_profile for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "learning profile own insert" on public.bible_user_learning_profile;
create policy "learning profile own insert" on public.bible_user_learning_profile for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists "learning profile own update" on public.bible_user_learning_profile;
create policy "learning profile own update" on public.bible_user_learning_profile for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

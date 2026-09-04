create index if not exists bible_group_encouragements_sender_idx on public.bible_group_encouragements(sender_id);
create index if not exists bible_group_encouragements_recipient_idx on public.bible_group_encouragements(recipient_id) where recipient_id is not null;
create index if not exists bible_presence_user_idx on public.bible_presence(user_id);

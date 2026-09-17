-- Test-only parity grant for the ephemeral V5 push-provider local stack.
-- The hosted sender already exercises service-role access successfully.
grant select, insert, update, delete on table public.bible_push_subscriptions to service_role;

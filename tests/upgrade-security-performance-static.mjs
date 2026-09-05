import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const revoke=read('supabase/migrations/20260905_revoke_notification_trigger_rpc_execution.sql');
const perf=read('supabase/migrations/20260905_biblequest_upgrade_performance_cleanup.sql');
for(const fn of ['bq_notify_assignment()','bq_notify_assignment_feedback()','bq_notify_congregation_members()'])assert(revoke.includes(`revoke execute on function public.${fn} from public, anon, authenticated`),`trigger-only RPC execution must be revoked for ${fn}`);
for(const idx of ['bible_media_library_created_by_idx','bible_member_recognitions_user_idx','bible_member_recognitions_awarded_by_idx','bible_notifications_congregation_idx','bible_notifications_created_by_idx','bible_poll_responses_user_idx','bible_client_errors_user_idx','bible_client_errors_congregation_idx','bible_content_escalations_raised_by_idx','bible_content_escalations_resolved_by_idx','bible_account_deletion_requests_resolved_by_idx'])assert(perf.includes(idx),`missing performance index ${idx}`);
assert(perf.includes('created_by=(select auth.uid())')&&perf.includes('user_id=(select auth.uid())')&&perf.includes('raised_by=(select auth.uid())'),'new feature RLS policies must use initplan-safe auth.uid lookups');
console.log('✓ New-feature security RPC revocation + FK/RLS performance hardening static smoke');

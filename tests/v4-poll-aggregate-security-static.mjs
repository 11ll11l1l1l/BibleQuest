import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const originalTotals=read('supabase/migrations/20260905_bible_poll_totals_rpc.sql');
const originalAdvanced=read('supabase/migrations/20260905_biblequest_production_workflows_v1.sql');
const hardened=read('supabase/migrations/20260913034500_poll_aggregates_private_definers.sql');
const has=(text,token,message)=>assert.ok(text.includes(token),message);

// Preserve the PostgREST contract that existing browser/backend callers use.
has(originalTotals,'public.bible_poll_totals(p_poll uuid)','Original totals RPC parameter contract changed unexpectedly.');
has(originalAdvanced,'public.bible_poll_aggregate_v2(p_poll uuid)','Original advanced aggregate RPC parameter contract changed unexpectedly.');
has(hardened,'public.bible_poll_totals(p_poll uuid)','Hardened totals RPC must preserve p_poll uuid.');
has(hardened,'returns table(option_index integer,total bigint)','Hardened totals RPC must preserve its table return shape.');
has(hardened,'public.bible_poll_aggregate_v2(p_poll uuid)','Hardened advanced aggregate must preserve p_poll uuid.');
has(hardened,'returns jsonb','Hardened advanced aggregate must preserve its jsonb return shape.');

// Exposed public functions must never retain SECURITY DEFINER.
const totalsWrapper=hardened.split('create or replace function public.bible_poll_totals')[1]?.split('comment on function public.bible_poll_totals')[0]||'';
const aggregateWrapper=hardened.split('create or replace function public.bible_poll_aggregate_v2')[1]?.split('comment on function public.bible_poll_aggregate_v2')[0]||'';
has(totalsWrapper,'security invoker','Public totals RPC must be SECURITY INVOKER.');
has(aggregateWrapper,'security invoker','Public advanced aggregate RPC must be SECURITY INVOKER.');
assert.ok(!totalsWrapper.includes('security definer'),'Public totals RPC must not remain SECURITY DEFINER.');
assert.ok(!aggregateWrapper.includes('security definer'),'Public advanced aggregate RPC must not remain SECURITY DEFINER.');
has(totalsWrapper,"set search_path=''",'Public totals wrapper must keep an empty search_path.');
has(aggregateWrapper,"set search_path=''",'Public advanced wrapper must keep an empty search_path.');
has(totalsWrapper,'private.bible_poll_totals_impl(p_poll)','Public totals wrapper must delegate only to the private implementation.');
has(aggregateWrapper,'private.bible_poll_aggregate_v2_impl(p_poll)','Public advanced wrapper must delegate only to the private implementation.');

// Privileged row reads belong only in the non-exposed private schema.
const totalsImpl=hardened.split('create or replace function private.bible_poll_totals_impl')[1]?.split('create or replace function public.bible_poll_totals')[0]||'';
const aggregateImpl=hardened.split('create or replace function private.bible_poll_aggregate_v2_impl')[1]?.split('create or replace function public.bible_poll_aggregate_v2')[0]||'';
has(totalsImpl,'security definer','Private totals implementation must be SECURITY DEFINER.');
has(aggregateImpl,'security definer','Private advanced aggregate implementation must be SECURITY DEFINER.');
has(totalsImpl,"set search_path=''",'Private totals implementation must pin an empty search_path.');
has(aggregateImpl,"set search_path=''",'Private advanced aggregate implementation must pin an empty search_path.');
has(totalsImpl,'auth.uid()','Totals implementation must bind visibility to the authenticated caller.');
has(aggregateImpl,'private.is_bible_congregation_member(p.congregation_id)','Advanced aggregate must verify congregation membership.');
has(aggregateImpl,"private.bible_role_in_congregation(p.congregation_id)",'Advanced aggregate must keep role-gated result visibility.');
has(aggregateImpl,"p.results_visibility='leader_only'",'Leader-only poll result privacy must remain enforced.');
has(aggregateImpl,"p.results_visibility='hidden_until_close'",'Hidden-until-close poll result privacy must remain enforced.');

// PUBLIC/anon must stay unable to call either layer; existing authenticated and
// service-role compatibility must remain explicit.
for(const fn of ['private.bible_poll_totals_impl','private.bible_poll_aggregate_v2_impl','public.bible_poll_totals','public.bible_poll_aggregate_v2']){
  has(hardened,`revoke all on function ${fn}(uuid) from public,anon`,`${fn} must explicitly revoke PUBLIC and anon execution.`);
}
has(hardened,'grant execute on function private.bible_poll_totals_impl(uuid) to authenticated','Private totals implementation must be authenticated-only.');
has(hardened,'grant execute on function public.bible_poll_totals(uuid) to authenticated','Public totals RPC must remain authenticated-only.');
has(hardened,'grant execute on function private.bible_poll_aggregate_v2_impl(uuid) to authenticated,service_role','Private advanced aggregate must preserve authenticated/service-role compatibility.');
has(hardened,'grant execute on function public.bible_poll_aggregate_v2(uuid) to authenticated,service_role','Public advanced aggregate must preserve authenticated/service-role compatibility.');

console.log('BibleQuest V4 poll aggregate private-definer security contract passed.');

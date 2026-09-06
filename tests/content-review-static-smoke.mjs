import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const index=read('index.html');
const page=read('content-review.html');
const review=read('content-review.js');
const moderation=read('content-moderation-runtime.js');
const report=read('content-report.js');
const link=read('content-review-link.js');
const migration=read('supabase/migrations/20260905_content_review_and_reports.sql');

assert(page.includes('content-review.css')&&page.includes('content-review.js'),'review page must load its UI/runtime');
assert(page.includes('@supabase/supabase-js@2.112.4'),'review page Supabase dependency must remain pinned');
assert(review.includes("new Set(['leader','pastor','admin'])"),'Leader/Pastor/Admin reviewer roles missing');
for(const table of ['bible_content_decisions','bible_content_reports'])assert(review.includes(table),`review UI missing ${table}`);
for(const decision of ['include','exempt','remove'])assert(review.includes(`data-decision=\"${decision}\"`)||review.includes(`decision==='${decision}'`)||review.includes(`${decision}:`),`review UI missing ${decision} decision`);
assert(review.includes('data/quarantine/questions/${encodeURIComponent(code)}.json'),'review UI must load actual per-book quarantine source');
assert(report.includes("bible_content_reports').insert"),'member report command must persist to the review queue');
for(const reason of ['doctrinal','accuracy','wording','inappropriate','duplicate','source','other'])assert(report.includes(`value=\"${reason}\"`),`report reason missing: ${reason}`);
assert(report.includes(".verse-list,[data-bq-scripture]")||report.includes(".verse-list,[data-bq-scripture]"),'Report must avoid treating raw Scripture verses as removable app content');
assert(moderation.includes("['exempt','remove'].includes"),'runtime must suppress exempted/removed questions');
assert(moderation.includes("decision==='include'")&&moderation.includes('data/quarantine/questions/'),'approved quarantine items must be able to re-enter the congregation question pack');
assert(moderation.includes('question:${code}:${row.id}'),'imported question decisions must use stable exact IDs');
assert(index.indexOf('runtime-safety.js')<index.indexOf('content-moderation-runtime.js')&&index.indexOf('content-moderation-runtime.js')<index.indexOf('app.js'),'moderation must run after doctrinal safety and before app content');
assert(index.includes('content-report.js')&&index.includes('content-review-link.js'),'production app must load report/review entry points');
assert(link.includes("new Set(['leader','pastor','admin'])")&&link.includes('content-review.html'),'authorized ministry review link missing');
assert(migration.includes('private.bible_can_review_content')&&migration.includes("role in ('leader','pastor','admin')"),'database reviewer authorization missing');
assert(migration.includes('enable row level security'),'moderation tables must use RLS');
assert(!migration.includes('grant delete on table public.bible_content_'),'browser roles must not receive moderation delete privileges');

console.log('Content review static smoke passed: quarantine review, congregation decisions, and member reporting are wired and role-scoped.');

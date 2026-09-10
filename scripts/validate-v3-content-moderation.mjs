import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['CONTENT_MODERATION_V3.md','FEATURE_INVENTORY_V3.md','src/app/content-moderation.js','src/app/games.js','src/app/bootstrap.js','src/core/api.js','src/core/recall-packs.js','src/app/congregation-membership.js','supabase/migrations/20260905_content_review_and_reports.sql','tests/v3-content-moderation-edge.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #88 Content Moderation file: ${file}`);

if(!failures.length){
  const service=read('src/app/content-moderation.js');
  const games=read('src/app/games.js');
  const bootstrap=read('src/app/bootstrap.js');
  const api=read('src/core/api.js');
  const recall=read('src/core/recall-packs.js');
  const migration=read('supabase/migrations/20260905_content_review_and_reports.sql');
  const inventory=read('FEATURE_INVENTORY_V3.md');
  const workflow=read('.github/workflows/v3-regression.yml');

  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','document.','fetch(','createClient','@supabase'])if(service.includes(forbidden))fail(`Content Moderation owner bypasses a verified boundary: ${forbidden}`);
  for(const token of ["const DECISIONS=new Set(['include','exempt','remove'])","const ORIGINS=new Set(['quarantine','user_report','review'])",'session.getState()','congregation.load()','await api.list(selected.id)','BQ_CONTENT_MODERATION_SCOPE_DENIED','status:previousLoadedAt?\'stale\':\'unavailable\'','hasRecallIncludes','applyCore','applyRecall','moderationOverride:\'include\''])if(!service.includes(token))fail(`Content Moderation owner missing contract token: ${token}`);

  for(const token of ["const CONTENT_DECISION_FIELDS='congregation_id,content_key,content_type,origin,decision,updated_at'","from('bible_content_decisions')",'.eq(\'congregation_id\',id)',".limit(4000)","withTimeout(request,1400,'Content moderation policy took too long to load.')",'contentDecisions'])if(!api.includes(token))fail(`Shared API missing retained Content Moderation read contract: ${token}`);
  const decisionBlock=api.slice(api.indexOf('const contentDecisions'),api.indexOf('const contentReports'));
  for(const forbidden of ['.insert(','.update(','.upsert(','.delete('])if(decisionBlock.includes(forbidden))fail(`Content Moderation API must remain read-only: ${forbidden}`);

  for(const token of ['loadQuarantine','data/quarantine/questions/${normalized}.json',"row?.safety?.action!=='quarantine'",'quarantineCache'])if(!recall.includes(token))fail(`Recall owner missing quarantine candidate contract: ${token}`);
  for(const forbidden of ['bible_content_decisions','createClient','@supabase'])if(recall.includes(forbidden))fail(`Recall owner bypasses Content Moderation/API ownership: ${forbidden}`);

  for(const token of ['moderation.applyCore(base)','moderation.hasRecallIncludes(loaded.book.code)','recall.loadQuarantine(loaded.book.code)','moderation.applyRecall(loaded.book.code,loaded.items,quarantined)','current content policy'])if(!games.includes(token))fail(`Games owner missing Content Moderation consumption contract: ${token}`);
  for(const forbidden of ['bible_content_decisions','data/quarantine/questions','createClient','@supabase'])if(games.includes(forbidden))fail(`Games owner bypasses Content Moderation/Recall ownership: ${forbidden}`);

  for(const token of ['createContentModerationService','createContentModerationService({api:api.contentDecisions,session,congregation})','createGameLauncherService({progress,storage,recall,moderation:contentModeration})','contentModeration.refresh()','contentModeration.clear()'])if(!bootstrap.includes(token))fail(`Bootstrap missing Content Moderation composition contract: ${token}`);

  for(const token of ['create table if not exists public.bible_content_decisions',"decision text not null check (decision in ('include','exempt','remove'))","origin text not null default 'review' check (origin in ('quarantine','user_report','review'))",'content decisions congregation read','private.is_bible_congregation_member(congregation_id)'])if(!migration.includes(token))fail(`Retained Content Moderation backend/RLS contract missing: ${token}`);

  const row88=inventory.split('\n').find(line=>line.startsWith('| 88 |'))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row88))fail('Inventory #88 Content moderation must use a valid lifecycle state.');
  for(const test of ['scripts/validate-v3-content-moderation.mjs','tests/v3-content-moderation-edge.mjs','tests/v3-games-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #88 regression: ${test}`);
}

if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Content Moderation architecture/ownership boundary passed.');
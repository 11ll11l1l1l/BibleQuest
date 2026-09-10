import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['CONTENT_REVIEW_V3.md','FEATURE_INVENTORY_V3.md','src/app/content-review.js','src/features/content-review/index.js','src/core/api.js','src/core/recall-packs.js','src/app/bootstrap.js','src/features/more/index.js','supabase/migrations/20260905_content_review_and_reports.sql','tests/v3-content-review-edge.mjs','tests/v3-content-review-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #91 Content Review file: ${file}`);

if(!failures.length){
  const service=read('src/app/content-review.js');
  const ui=read('src/features/content-review/index.js');
  const api=read('src/core/api.js');
  const recall=read('src/core/recall-packs.js');
  const bootstrap=read('src/app/bootstrap.js');
  const more=read('src/features/more/index.js');
  const migration=read('supabase/migrations/20260905_content_review_and_reports.sql');
  const inventory=read('FEATURE_INVENTORY_V3.md');
  const workflow=read('.github/workflows/v3-regression.yml');

  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','document.','fetch(','createClient','@supabase','progress.'])if(service.includes(forbidden))fail(`Content Review service bypasses a verified owner: ${forbidden}`);
  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','createClient','@supabase','.from(','hashchange'])if(ui.includes(forbidden))fail(`Content Review UI bypasses a verified owner: ${forbidden}`);
  if(/decision\s*[:=]\s*['"]delete['"]/.test(service)||/data-content-review-decide=["']delete["']/.test(ui))fail('Content Review must not reproduce the database-incompatible legacy delete decision.');

  for(const token of ["new Set(['leader','pastor','admin'])","new Set(['owner','admin'])","new Set(['include','exempt','remove'])",'congregation.load()','api.platformAccess(user.id)','api.listPlatformCongregations()','api.loadQueue(selected.id)','recall.loadManifest()','recall.loadQuarantine(normalized)','api.saveDecision(row)','api.markReportsReviewed(','BQ_CONTENT_REVIEW_PARTIAL_SAVE','BQ_CONTENT_REVIEW_DECISION_INVALID','note.length>1200'])if(!service.includes(token))fail(`Content Review service missing contract token: ${token}`);
  for(const token of ['contentReviewPage','data-content-review-congregation','data-content-review-tab="quarantine"','data-content-review-tab="reports"','data-content-review-search','data-content-review-filter','data-content-review-rationale','data-content-review-decide="include"','data-content-review-decide="exempt"','data-content-review-decide="remove"','review.decide(','review.clear()'])if(!ui.includes(token))fail(`Content Review UI missing contract token: ${token}`);

  for(const token of ["from('bible_app_access')","from('bible_congregations')","from('bible_content_decisions')","from('bible_content_reports')","from('bible_congregation_members')",'.limit(4000)','.limit(500)',"upsert(row,{onConflict:'congregation_id,content_key'})","status:'reviewed'",'contentReview'])if(!api.includes(token))fail(`Shared API missing Content Review backend contract: ${token}`);
  for(const token of ['quarantinedQuestions','quarantined_questions','loadQuarantine'])if(!recall.includes(token))fail(`Recall owner missing Content Review quarantine contract: ${token}`);

  for(const token of ["createContentReviewService","createContentReviewService({api:api.contentReview,session,congregation,recall})","contentReviewPage","'content-review':()=>contentReviewPage","onContentReview:()=>router.navigate('content-review')","contentReview.clear()"] )if(!bootstrap.includes(token))fail(`Bootstrap missing Content Review composition contract: ${token}`);
  for(const token of ['onContentReview','data-more-content-review','data-open-content-review','Open Content Review'])if(!more.includes(token))fail(`More page missing Content Review entry contract: ${token}`);

  for(const token of ["a.role in ('owner','admin')","m.role in ('leader','pastor','admin')","decision in ('include','exempt','remove')",'content reports reviewer update','content decisions reviewer insert','content decisions reviewer update'])if(!migration.includes(token))fail(`Retained Content Review schema/RLS contract missing: ${token}`);

  const row91=inventory.split('\n').find(line=>line.startsWith('| 91 |'))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row91))fail('Inventory #91 Content Review must use a valid lifecycle state.');
  if(!/^\s*on:\s*\n\s+workflow_dispatch:\s*$/m.test(workflow))fail('Product v3 regression workflow must remain workflow_dispatch-only.');
  if(/\n\s+push:\s*$/m.test(workflow))fail('Product v3 regression workflow must not contain a push trigger.');
  for(const test of ['scripts/validate-v3-content-review.mjs','tests/v3-content-review-edge.mjs','tests/v3-content-review-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #91 regression: ${test}`);
}

if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Content Review architecture/ownership boundary passed.');

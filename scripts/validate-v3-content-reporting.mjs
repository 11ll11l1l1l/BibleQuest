import fs from 'node:fs';
import { workflowInvokesNode } from './v3-workflow-contract.mjs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['CONTENT_REPORTING_V3.md','FEATURE_INVENTORY_V3.md','src/app/content-reporting.js','src/ui/content-reporting.js','src/ui/content-reporting.css','src/app/bootstrap.js','src/core/api.js','src/app/congregation-membership.js','supabase/migrations/20260905_content_review_and_reports.sql','index.html','tests/v3-content-reporting-edge.mjs','tests/v3-content-reporting-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #87 Content Reporting file: ${file}`);

if(!failures.length){
  const service=read('src/app/content-reporting.js');
  const runtime=read('src/ui/content-reporting.js');
  const api=read('src/core/api.js');
  const bootstrap=read('src/app/bootstrap.js');
  const css=read('src/ui/content-reporting.css');
  const migration=read('supabase/migrations/20260905_content_review_and_reports.sql');
  const index=read('index.html');
  const inventory=read('FEATURE_INVENTORY_V3.md');
  const workflow=read('.github/workflows/v3-regression.yml');

  for(const forbidden of ['localStorage','sessionStorage','window.BQ','MutationObserver','document.','fetch(','createClient','@supabase','progress.'])if(service.includes(forbidden))fail(`Content Reporting owner bypasses a verified boundary: ${forbidden}`);
  for(const token of ["['question','statement','answer','explanation','story','reader','other']","['doctrinal','accuracy','wording','inappropriate','duplicate','source','other']",'session.getState()','congregation.load()','congregation.get(id)','reporter_id:String(user.id)','await api.submit(row)','BQ_CONTENT_REPORT_AUTH_REQUIRED','BQ_CONTENT_REPORT_MEMBERSHIP_REQUIRED','BQ_CONTENT_REPORT_REASON_INVALID'])if(!service.includes(token))fail(`Content Reporting owner missing contract token: ${token}`);
  if(service.includes("'technical'"))fail('Content Reporting owner must not expose the database-incompatible legacy technical reason.');

  for(const forbidden of ['window.BQ','MutationObserver','localStorage','sessionStorage','createClient','@supabase'])if(runtime.includes(forbidden))fail(`Content Reporting UI bypasses a verified owner: ${forbidden}`);
  for(const token of ['REPORTABLE_ROUTES','EXCLUDED_SELECTOR','[data-private-note]','[data-cloud-note]','[data-user-content]','snapshotReportableContent','mountContentReportingRuntime','contentReportingRoot','role="dialog"','aria-modal="true"','maxlength="1200"','reporting.prepare()','reporting.submit('])if(!runtime.includes(token))fail(`Content Reporting UI missing contract token: ${token}`);
  for(const privateRoute of ["'account'","'private-notes'","'cloud-notes'","'couples-family'","'couples-cloud'","'community'","'workspace'","'congregation'","'psychometrics'","'transform'","'reader'"]){
    const routeLine=runtime.split('\n').find(line=>line.includes('REPORTABLE_ROUTES'))||'';
    if(routeLine.includes(privateRoute))fail(`Private/excluded route leaked into Content Reporting allowlist: ${privateRoute}`);
  }

  for(const token of ["from('bible_content_reports')",'.insert(row)',"select('id,congregation_id,reporter_id,content_key,reason,status,created_at')",'contentReports'])if(!api.includes(token))fail(`Shared API missing Content Reporting backend contract: ${token}`);
  for(const token of ["createContentReportingService","createContentReportingService({api:api.contentReports,session,congregation})","mountContentReportingRuntime","reporting:contentReporting","contentReportingRuntime.dispose()"] )if(!bootstrap.includes(token))fail(`Bootstrap missing Content Reporting composition contract: ${token}`);
  if(!index.includes('src/ui/content-reporting.css'))fail('index.html does not load Content Reporting presentation CSS.');

  for(const token of ['create table if not exists public.bible_content_reports','alter table public.bible_content_reports enable row level security','content reports submit own','private.is_bible_congregation_member(congregation_id)'])if(!migration.includes(token))fail(`Retained Content Reporting backend/RLS contract missing: ${token}`);
  for(const token of ['min-height:44px','@media(max-width:520px)'])if(!css.includes(token))fail(`Content Reporting CSS missing mobile/touch contract: ${token}`);

  const row87=inventory.split('\n').find(line=>line.startsWith('| 87 |'))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row87))fail('Inventory #87 Content reporting must use a valid lifecycle state.');
  for(const test of ['scripts/validate-v3-content-reporting.mjs','tests/v3-content-reporting-edge.mjs','tests/v3-content-reporting-smoke.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #87 regression: ${test}`);
}

if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Content Reporting architecture/ownership boundary passed.');

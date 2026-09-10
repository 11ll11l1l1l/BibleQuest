import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const fail=message=>{console.error(`Admin Operations architecture violation: ${message}`);process.exitCode=1};
const required=['ADMIN_OPERATIONS_V3.md','admin-operations.html','src/app/admin-operations.js','src/app/admin-operations-entry.js','src/features/admin-operations/index.js','src/ui/admin-operations.css','tests/v3-admin-operations-edge.mjs','tests/v3-admin-operations-smoke.mjs'];
for(const path of required)if(!fs.existsSync(path))fail(`missing ${path}`);
if(process.exitCode)process.exit();

const contract=read('ADMIN_OPERATIONS_V3.md'),html=read('admin-operations.html'),service=read('src/app/admin-operations.js'),entry=read('src/app/admin-operations-entry.js'),view=read('src/features/admin-operations/index.js'),api=read('src/core/api.js'),adminEntry=read('src/app/admin-entry.js'),adminView=read('src/features/admin-console/index.js'),backend=read('supabase/functions/bq-admin-ops/index.ts'),css=read('src/ui/admin-operations.css'),workflow=read('.github/workflows/v3-regression.yml'),inventory=read('FEATURE_INVENTORY_V3.md');

for(const phrase of['Owner account-deletion','bq-admin-ops','individual voter identity is not rendered','active owner account cannot delete itself','production'])if(!contract.toLowerCase().includes(phrase.toLowerCase()))fail(`contract missing ${phrase}`);
if(!html.includes('src/app/admin-operations-entry.js')||!html.includes('src/ui/admin-operations.css'))fail('standalone entry must load v3 module and v3 responsive styles');
for(const forbidden of['admin-operations.js"></script>','cloud-config.js','cdn.jsdelivr.net/npm/@supabase','window.BQ'])if(html.includes(forbidden))fail(`standalone entry retains legacy runtime: ${forbidden}`);
if(!entry.includes('createAdminOperationsService')||!entry.includes('api.adminOperations')||!entry.includes('createSessionService'))fail('entry must compose Session, shared API facade and Admin Operations service');
for(const forbidden of['createClient','supabase.','client.from','client.functions','fetch(','localStorage','sessionStorage','window.BQ','MutationObserver'])if(service.includes(forbidden))fail(`service bypasses owner boundary with ${forbidden}`);
for(const requiredToken of['status','dashboard','frontendHealth','deleteUser','BQ_ADMIN_OPS_SELF_DELETE','BQ_ADMIN_OPS_OWNER_REQUIRED','clientErrors24h'])if(!service.includes(requiredToken))fail(`service missing ${requiredToken}`);
if(!service.includes("if(!currentUser())")&&!service.includes("if(!user)return reset('signed-out')"))fail('service must fail signed-out before privileged calls');
if(service.includes('user_id:')&&service.includes('clientErrors24h'))fail('service must not project privileged client-error user identifiers');
for(const requiredToken of["invoke('bq-admin-ops',{action:'status'})","invoke('bq-admin-ops',{action:'health'})","invoke('bq-admin-ops',{action:'dashboard'})","invoke('bq-admin-ops',{action:'delete_user',targetUserId})",'frontendHealth'])if(!api.includes(requiredToken))fail(`central API missing ${requiredToken}`);
for(const forbiddenPath of['src/app/admin-operations.js','src/features/admin-operations/index.js','src/app/admin-operations-entry.js','src/features/admin-console/index.js']){const text=read(forbiddenPath);if(text.includes("functions.invoke('bq-admin-ops")||text.includes('/functions/v1/bq-admin-ops'))fail(`${forbiddenPath} invokes bq-admin-ops directly`)}
for(const requiredToken of['System health','Who is online','Leader / pastor assignments','Devotionals & announcements','Congregation polls','Handpicked videos & channels','Live rooms & live polls','individual voter records are not displayed','data-ops-filter','data-ops-refresh'])if(!view.includes(requiredToken))fail(`dashboard rendering missing ${requiredToken}`);
if(!css.includes('@media(max-width:620px)')||!css.includes('grid-template-columns:repeat(2'))fail('responsive Admin Operations contract is missing');
for(const requiredToken of['delete_user','Only the BibleQuest owner can delete accounts','active owner account cannot delete itself','Transfer congregation ownership first','Transfer small-group ownership first','delete_account','auth.admin.deleteUser'])if(!backend.includes(requiredToken))fail(`retained server authority missing ${requiredToken}`);
if(!adminEntry.includes('createAdminOperationsService')||!adminEntry.includes('accountDeletion')||!adminEntry.includes('api.adminOperations'))fail('Admin Console entry must compose #93 deletion owner instead of duplicating it');
for(const requiredToken of['data-admin-delete-user','accountDeletion.deleteUser','DELETE ${user.email||user.name}','accountDeletion.authorize'])if(!adminView.includes(requiredToken))fail(`Admin Console Owner deletion composition missing ${requiredToken}`);
if(adminView.includes('bq-admin-ops')||adminView.includes('functions.invoke'))fail('Admin Console rendering must not own the #93 backend endpoint');
if(!workflow.includes('validate-v3-admin-operations.mjs')||!workflow.includes('v3-admin-operations-edge.mjs')||!workflow.includes('v3-admin-operations-smoke.mjs'))fail('accumulated workflow must include all #93 permanent checks');
if(/\npush\s*:/.test(workflow)||/\npush\s*:/.test(workflow.replace(/workflow_dispatch\s*:/g,'')))fail('product v3 regression workflow must remain manual-only');
if(!/^\| 93 \| Admin operations \| Yes \| Standalone old \| (?:Not started|Implemented|Verified|Regression-tested) \|/m.test(inventory))fail('inventory #93 row is missing or malformed');
if(!/^\| 94 \| Reset\/recovery page \| Yes \| Standalone old \| Not started \|/m.test(inventory))fail('capability #93 must not absorb #94 reset/recovery');

if(!process.exitCode)console.log('BibleQuest v3 Admin Operations architecture validation passed.');
import fs from 'node:fs';

const failures=[];
const fail=message=>failures.push(message);
const read=file=>fs.readFileSync(file,'utf8');
const required=['CONGREGATION_MEMBERSHIP_V3.md','MINISTRY_ROLES.md','FEATURE_INVENTORY_V3.md','ARCHITECTURE_V3.md','src/app/congregation-membership.js','src/features/congregation/index.js','src/features/more/index.js','src/core/api.js','src/app/bootstrap.js'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing congregation membership recovery file: ${file}`);
if(!failures.length){
  const owner=read('src/app/congregation-membership.js');
  const api=read('src/core/api.js');
  const ui=read('src/features/congregation/index.js');
  const more=read('src/features/more/index.js');
  const boot=read('src/app/bootstrap.js');
  const roles=read('MINISTRY_ROLES.md');
  const inventory=read('FEATURE_INVENTORY_V3.md');
  const architecture=read('ARCHITECTURE_V3.md');
  for(const role of['member','facilitator','leader','pastor','admin'])if(!owner.includes(`'${role}'`))fail(`Membership owner is missing recovered congregation role ${role}.`);
  if(owner.includes("'owner'"))fail('Platform Owner must not be accepted as a congregation role.');
  for(const contract of['api.congregation.listMemberships','api.congregation.join','BQ_CONGREGATION_PERMISSION_DENIED','BQ_CONGREGATION_AUTH_REQUIRED'])if(!owner.includes(contract))fail(`Membership owner missing contract ${contract}.`);
  if(/localStorage|sessionStorage|createClient|\.from\(|functions\.invoke|fetch\s*\(/.test(owner))fail('Congregation membership owner bypasses API/storage ownership.');
  for(const contract of["'bible_congregation_members'","'bible_congregations'","'bq-join'"])if(!api.includes(contract))fail(`Central API wrapper is missing congregation contract ${contract}.`);
  if(/bible_congregation_members|bible_congregations|bq-join|createClient|functions\.invoke|localStorage|sessionStorage/.test(ui))fail('Congregation UI bypasses its membership/API owner.');
  if(!more.includes('data-open-congregation'))fail('More page must expose the recovered congregation membership screen.');
  for(const contract of['createCongregationMembershipService','congregationPage','morePage'])if(!boot.includes(contract))fail(`Bootstrap is missing congregation composition contract ${contract}.`);
  if(!roles.includes('| Pastor | One congregation |')||!roles.includes('| Facilitator | One congregation |'))fail('Live ministry role documentation is missing recovered congregation roles.');
  if(!roles.includes('Authorization must be enforced on the server'))fail('Server-authority rule must remain explicit in MINISTRY_ROLES.md.');
  if(!inventory.includes('| 66 | Congregation membership/roles | Yes | Compatibility | Regression-tested |'))fail('Inventory must promote #66 after the later #96 full functional gate.');
  for(const total of['**Regression-tested:** 56','**Verified:** 1','**Not started:** 43'])if(!inventory.includes(total))fail(`Inventory totals missing post-#96 bookkeeping: ${total}`);
  for(const contract of['src/app/congregation-membership.js','## Congregation membership / role boundaries','RLS and trusted server functions remain authoritative'])if(!architecture.includes(contract))fail(`Architecture contract missing Congregation Membership boundary: ${contract}`);
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 congregation membership architecture boundary passed.');

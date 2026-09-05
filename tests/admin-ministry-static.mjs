import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const adminLink=read('admin-link.js');
const admin=read('admin.js');
const adminHtml=read('admin.html');
const adminFn=read('supabase/functions/bq-admin/index.ts');
const cloud=read('cloud.js');
const assignment=read('supabase/functions/bq-assignment/index.ts');
const invite=read('supabase/functions/bq-invite/index.ts');
const score=read('supabase/functions/bq-score/index.ts');

must(adminLink.includes("#bqAccountLayer:not(.hidden) .account-brand"),'Admin link must be discoverable from the Account panel');
must(adminLink.includes(".top-actions"),'Admin link must remain available in the application header');
must(adminLink.includes("client.functions.invoke('bq-admin'"),'Admin discovery needs a server-status fallback');
must(adminHtml.includes('BibleQuest Admin & Ministry'),'Admin page must identify the combined administration/ministry console');

must(adminFn.includes("const SITE_ROLES=new Set(['member','admin','owner'])"),'Platform roles must exclude Pastor/Leader');
must(adminFn.includes("const CONGREGATION_ROLES=new Set(['member','facilitator','leader','pastor','admin'])"),'Congregation roles must include ministry roles');
must(adminFn.includes('Pastor/Leader roles belong to a congregation'),'Backend must reject new global Pastor/Leader grants');

must(admin.includes("['member','admin','owner']"),'Admin platform-access selector must use platform roles only');
must(admin.includes("['member','facilitator','leader','pastor','admin']"),'Admin ministry selector must expose congregation roles');
must(admin.includes("functions.invoke('bq-create-congregation'"),'Admin console must support first-congregation setup');
must(admin.includes('MINISTRY SETUP REQUIRED'),'Admin console must make missing congregation setup explicit');
must(admin.includes('Congregation ministry roles'),'User cards must distinguish ministry roles from platform access');

for(const [name,src] of [['cloud.js',cloud],['bq-assignment',assignment],['bq-invite',invite],['bq-score',score]]){
  must(src.includes("'pastor'"),`${name} must explicitly recognize Pastor authority where leadership controls apply`);
}
must(cloud.includes("['facilitator','leader','pastor','admin'].includes(callerRole())"),'Pastor must receive congregation controls already authorized by backend');

console.log('admin/ministry static checks passed');

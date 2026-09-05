import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const must=(condition,message)=>{if(!condition)throw new Error(message)};

const signup=read('supabase/functions/bq-signup/index.ts');
const adminFn=read('supabase/functions/bq-admin/index.ts');
const admin=read('admin.js');
const adminLink=read('admin-link.js');

must(signup.includes("const DEFAULT_CONGREGATION_NAME='ICAC'"),'Signup must define ICAC as the default congregation');
must(signup.includes("from('bible_congregations').select('id,name').eq('name',DEFAULT_CONGREGATION_NAME).eq('active',true)"),'Signup must resolve the live ICAC congregation instead of hard-coding an id');
must(signup.includes("from('bible_congregation_members').upsert"),'Signup must create a real congregation membership');
must(signup.includes("role:'member'"),'New registrations must enter ICAC as members');
must(signup.includes('default ICAC congregation is not configured'),'Signup must fail closed if ICAC is unavailable');
must(!signup.includes('cleanText(body.church_group,120)'),'Signup must not trust a free-text congregation supplied by the browser');

must(adminLink.includes("const DEFAULT_CONGREGATION='ICAC'"),'Registration UI must visibly default to ICAC');
must(adminLink.includes("input[name=\"church_group\"]"),'Registration UI must lock the existing congregation field');
must(adminLink.includes('input.readOnly=true'),'Registration congregation must not remain free-text editable');

for(const action of ['set_congregation','remove_congregation','create_small_group','set_group_membership','set_group_owner']){
  must(adminFn.includes(`action==='${action}'`),`Admin backend must implement ${action}`);
}
must(adminFn.includes("from('bible_admin_audit_log').insert"),'Admin membership changes must remain audited');
must(adminFn.includes('Transfer congregation ownership before moving them'),'Congregation correction must protect congregation owners');
must(adminFn.includes('Transfer group ownership before moving them'),'Congregation correction must protect small-group owners');
must(adminFn.includes('is full'),'Small-group assignment must enforce group capacity');

must(admin.includes('Default registration congregation'),'Admin UI must explain the ICAC registration default');
must(admin.includes('data-set-congregation'),'Admin UI must allow direct congregation correction');
must(admin.includes('data-remove-congregation'),'Admin UI must allow an incorrect congregation membership to be removed');
must(admin.includes('data-admin-create-group'),'Admin UI must allow small-group creation');
must(admin.includes('data-assign-group'),'Admin UI must allow direct small-group assignment');
must(admin.includes('data-remove-group'),'Admin UI must allow small-group removal');
must(admin.includes('data-make-group-owner'),'Admin UI must expose small-group ownership transfer');
must(admin.includes("action:'set_group_owner'"),'Group ownership transfer UI must call the protected backend action');
must(admin.includes('Transfer group ownership before removing this member.'),'Group owners must not be removable before ownership transfer');

console.log('ICAC default registration and admin membership static checks passed');

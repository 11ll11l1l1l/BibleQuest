import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const bootstrap=read('src/app/bootstrap.js');
const more=read('src/features/more/index.js');
const redirects=read('_redirects');
const adminEntry=read('src/app/admin-entry.js');

assert.ok(bootstrap.includes("createAdminAccessService({api:api.adminConsole,session})"),'Main app must use the shared server-authoritative Admin status facade.');
assert.ok(bootstrap.includes("location.href='./admin'"),'Authorized More entry must open the canonical Admin URL.');
assert.ok(more.includes("adminPanel.hidden=state?.authorized!==true"),'Admin entry must remain hidden unless verified Owner/Admin access is true.');
assert.ok(more.includes("data-open-admin"),'More must expose the authorized Admin control.');
assert.match(redirects,/\/admin\.html\s+\/admin\s+301/,'Canonical /admin URL redirect is missing.');
assert.ok(adminEntry.includes('createAdminConsoleService')&&adminEntry.includes('await session.boot()'),'Direct Admin URL must retain authenticated Admin Console authorization.');

console.log('V5 Admin reachability route/navigation contract: PASS');

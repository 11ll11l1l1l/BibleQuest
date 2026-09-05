import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'admin-link.js'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

assert(!source.includes('MutationObserver'),'admin access discovery must not observe the full document');
assert(!source.includes('setInterval('),'admin access discovery must not use permanent polling');
assert(source.includes('const MAX_RETRIES=20'),'admin access discovery must have a finite retry bound');
assert(source.includes('const RETRY_MS=500'),'admin access discovery retry cadence changed unexpectedly');
assert(source.includes('setTimeout(')&&source.includes('clearTimeout('),'bounded retry must clean up its timer');
assert(source.includes("if(!session?.user){")&&source.includes("resolved=true;role='';removeInjected();stopRetry();return true"),'signed-out startup must settle immediately');
assert(source.includes("[data-account-open],[data-auth-tab]"),'dynamic account surfaces must reconcile from targeted user-entry signals');
assert(source.includes("window.addEventListener('bq-modern-home-rendered'"),'dynamic Home rendering must still reconcile admin access');
assert(source.includes("window.addEventListener('bq-account-created'"),'newly-created accounts must refresh access');
assert(source.includes("const DEFAULT_CONGREGATION='ICAC'"),'ICAC registration default must remain intact');
assert(source.includes("role==='owner'?'PLATFORM OWNER'"),'Owner identity must remain intact');
assert(source.includes("window.BQAdminAccess={refresh,status:"),'public admin-access refresh/status API must remain available');

console.log('Admin-link static smoke passed: no global observer/permanent poll, retries bounded, current ICAC/Owner behavior preserved.');

import fs from 'node:fs';

const src=fs.readFileSync(new URL('../admin-link.js',import.meta.url),'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

must(src.includes("role==='owner'?'PLATFORM OWNER'"),'Owner account must have an explicit platform-owner label');
must(src.includes("chip.textContent='OWNER'"),'Owner must be visibly identified in the app header');
must(src.includes("#bqAccountLayer:not(.hidden) .account-profile-head>div"),'Owner role must be visible in Account profile details');
must(src.includes("makeLink('account-secondary','Admin & ministry')"),'Admin & Ministry must be directly available from Account');
must(src.includes('window.BQAdminAccess={refresh:check,status:'),'Owner/admin access diagnostic API must be available');
must(src.includes("client.functions.invoke('bq-admin'"),'Role discovery must retain server-side status fallback');

console.log('owner access visibility checks passed');

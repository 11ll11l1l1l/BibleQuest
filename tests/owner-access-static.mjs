import fs from 'node:fs';

const src=fs.readFileSync(new URL('../admin-link.js',import.meta.url),'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};

must(src.includes("role==='owner'?'PLATFORM OWNER'"),'Owner account must have an explicit platform-owner label');
must(src.includes('chip.textContent=roleLabel()'),'Owner must be visibly identified with the canonical platform role label');
must(src.includes("#bqAccountLayer:not(.hidden) .account-profile-head>div"),'Owner role must be visible in Account profile details');
must(src.includes("makeLink('account-secondary')")&&src.includes("label='⚙ Admin & ministry'"),'Admin & Ministry must be directly available from Account');
must(src.includes('window.BQAdminAccess={refresh,status:'),'Owner/admin access diagnostic API must expose the bounded refresh workflow');
must(src.includes("client.functions.invoke('bq-admin'"),'Role discovery must retain server-side status fallback');

console.log('owner access visibility checks passed');

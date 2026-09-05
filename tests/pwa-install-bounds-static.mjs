import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'pwa-runtime.js'),'utf8');
const fail=message=>{throw new Error(message)};
const assert=(condition,message)=>{if(!condition)fail(message)};

const version=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);
assert(version>=65,`bounded guest/PWA behavior requires cache v65+, got v${version||'missing'}`);
assert(sw.includes('const OPTIONAL_CACHE_TIMEOUT_MS=12000'),'optional shell caching must have an explicit finite timeout');
assert(sw.includes('const controller=new AbortController()'),'optional shell fetches must be abortable');
assert(sw.includes("setTimeout(()=>controller.abort(),OPTIONAL_CACHE_TIMEOUT_MS)"),'optional shell fetch timeout must abort stalled requests');
assert(sw.includes('clearTimeout(timer)'),'optional cache timers must be cleaned up');
assert(sw.includes('Promise.allSettled(optional.map(item=>cacheOptional(cache,item)))'),'one optional cache failure must not abort service-worker installation');
assert(runtime.includes(`bq_sw_controller_reload_v${version}`),'controller-change recovery flag must rotate with the service-worker cache version');
assert(sw.includes("'./guest-access-hardening.js'"),'guest access hardening must remain in the installed shell');
assert(sw.includes("const NO_RUNTIME_CACHE=['/data/library/']"),'large library packs must remain outside runtime Cache Storage');

console.log(`PWA install bounds static smoke passed · cache v${version} · stalled optional fetches abort after 12s.`);

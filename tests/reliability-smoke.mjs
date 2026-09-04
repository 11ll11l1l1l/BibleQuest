import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=msg=>{throw new Error(msg)};
const assert=(ok,msg)=>{if(!ok)fail(msg)};

const sw=read('sw.js');
const shell=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);
const forbiddenLargePrefixes=['data/library/','data/packs/bible/','data/packs/tagalog/','data/packs/questions/','data/packs/context/'];
for(const item of shell){
  if(item==='data/packs/context/manifest.json'||item==='data/packs/manifest.json')continue;
  assert(!forbiddenLargePrefixes.some(prefix=>item.startsWith(prefix)),`large/on-demand dataset must not be precached: ${item}`);
}
assert(sw.includes("e.request.mode==='navigate'"),'service worker must special-case navigations');
assert(sw.includes("networkFirst(e.request,'./index.html')"),'navigations must be network-first with offline shell fallback');
assert(sw.includes("e.request.destination==='script'||e.request.destination==='style'"),'scripts/styles must refresh network-first');
assert(sw.includes('self.skipWaiting()'),'new service worker must not wait behind stale worker');
assert(sw.includes('self.clients.claim()'),'activated worker must claim open clients');

const headers=read('_headers');
for(const header of ['X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','Permissions-Policy:','X-Frame-Options: SAMEORIGIN']){
  assert(headers.includes(header),`missing production security header: ${header}`);
}

const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.display==='standalone','PWA display must remain standalone');
assert(manifest.start_url==='./'&&manifest.scope==='./','PWA start_url/scope must stay deployment-relative');
assert(Array.isArray(manifest.icons)&&manifest.icons.some(x=>x.sizes==='192x192')&&manifest.icons.some(x=>x.sizes==='512x512'),'PWA must expose install-sized icons');

const largeFiles=['data/library/bible_places.jsonl','data/library/bsb_bible_index.jsonl','data/library/cross_references.txt','data/library/stepbible_tipnr.txt'];
for(const file of largeFiles){
  const bytes=fs.statSync(path.join(root,file)).size;
  assert(bytes>5_000_000,`${file} no longer qualifies for the large-payload guard; update this test intentionally`);
  assert(!shell.includes(file),`${file} must remain on-demand and outside the service-worker shell`);
}

console.log(`Reliability smoke passed: ${shell.length} shell entries; large datasets remain on-demand.`);

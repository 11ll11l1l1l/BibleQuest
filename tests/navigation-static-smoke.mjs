import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));

function walk(dir='.'){
  const out=[];
  for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    if(['.git','node_modules'].includes(entry.name))continue;
    const rel=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(rel));
    else out.push(rel.replaceAll('\\','/'));
  }
  return out;
}

function external(ref){
  return !ref||ref.startsWith('#')||ref.startsWith('//')||/^(?:https?:|mailto:|tel:|javascript:|data:|blob:)/i.test(ref);
}

function clean(ref){return String(ref).trim().split('#')[0].split('?')[0]}

function resolves(fromFile,raw){
  if(external(raw))return true;
  const ref=clean(raw);
  if(!ref)return true;
  const base=ref.startsWith('/')?'.':path.dirname(fromFile);
  let target=path.normalize(path.join(base,ref.replace(/^\//,''))).replaceAll('\\','/');
  if(target==='.'||target==='')target='index.html';
  if(exists(target)){
    const stat=fs.statSync(path.join(root,target));
    if(stat.isDirectory())return exists(path.join(target,'index.html'));
    return true;
  }
  if(exists(`${target}.html`))return true;
  if(exists(path.join(target,'index.html')))return true;
  return false;
}

const htmlFiles=walk().filter(p=>p.endsWith('.html'));
const failures=[];
for(const file of htmlFiles){
  const html=read(file);
  const attrs=[...html.matchAll(/\b(?:href|src|action)\s*=\s*["']([^"']+)["']/gi)].map(m=>m[1]);
  for(const ref of attrs)if(!resolves(file,ref))failures.push(`${file} -> ${ref}`);
}
assert.deepEqual(failures,[],`Broken static HTML navigation/assets:\n${failures.join('\n')}`);

const index=read('index.html');
assert(!index.includes('security-center.js')&&!index.includes('security-center.css'),'retired Security & data UI must not load in production');
assert(!index.includes('accessibility-runtime.js')&&!index.includes('accessibility-runtime.css'),'retired Accessibility settings UI must not load in production');
assert(index.includes('home-professional.css'),'final professional Home polish must be production-loaded');

const launcher=read('transform-launcher.js');
assert(launcher.includes("const TARGET='./transform'"),'Transform launcher must use Cloudflare canonical /transform route');
assert(launcher.includes("const PSYCH_TARGET='./psychometrics'"),'Psychometrics launcher must use Cloudflare canonical route');
assert(read('admin-link.js').includes("a.href='admin'"),'Admin launcher must use canonical /admin route');
assert(read('content-review-link.js').includes("a.href='content-review'"),'Content Review launcher must use canonical route');
const recovery=read('password-recovery.js');
assert(recovery.includes("a.href='reset'")&&recovery.includes("setAttribute('href','reset')"),'Account Recovery must normalize legacy reset.html links to /reset');

const redirects=read('_redirects');
for(const row of [
  '/index.html / 301',
  '/transform.html /transform 301',
  '/psychometrics.html /psychometrics 301',
  '/admin.html /admin 301',
  '/admin-operations.html /admin-operations 301',
  '/content-review.html /content-review 301',
  '/reset.html /reset 301'
])assert(redirects.includes(row),`Missing Cloudflare compatibility redirect: ${row}`);

const sw=read('sw.js');
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);
assert(cacheVersion>=76,`navigation repair requires PWA cache v76+, got v${cacheVersion||'missing'}`);
assert(sw.includes('function canonicalHtmlNavigation(url)'),'service worker must normalize stale .html bookmarks');
assert(sw.includes('admin-operations|reset'),'service worker canonicalizer must include Admin Operations and Account Recovery');
assert(sw.includes('const isResetNavigation=/\\/reset(?:\\.html)?\\/?$/'),'service worker must preserve the Account Recovery offline document');
assert(sw.includes('Response.redirect(canonical,302)'),'service worker must redirect stale controlled .html navigations before network-first handling');
assert(!sw.includes('security-center.js')&&!sw.includes('security-center.css'),'retired Security & data assets must not remain in PWA cache');
assert(!sw.includes('accessibility-runtime.js')&&!sw.includes('accessibility-runtime.css'),'retired Accessibility settings assets must not remain in PWA cache');

console.log(`Navigation static smoke passed: ${htmlFiles.length} HTML entries checked, canonical standalone routes guarded, PWA v${cacheVersion}.`);

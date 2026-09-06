import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const required = [
  'index.html',
  'src/app/bootstrap.js',
  'src/app/router.js',
  'src/app/store.js',
  'src/app/session.js',
  'src/core/storage.js',
  'src/core/api.js',
  'src/ui/shell.js',
  'src/ui/app.css',
  'src/features/home/index.js',
  'src/features/account/index.js',
  'FEATURE_INVENTORY_V3.md',
  'ARCHITECTURE_V3.md'
];

for (const file of required) if (!fs.existsSync(path.join(root, file))) fail(`Missing v3 required file: ${file}`);

const html = read('index.html');
const scriptTags = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
if (scriptTags.length !== 1 || scriptTags[0] !== 'src/app/bootstrap.js') fail(`index.html must boot exactly one script entry. Found: ${scriptTags.join(', ') || 'none'}`);
if (!/type=["']module["']/.test(html)) fail('v3 bootstrap must be loaded as an ES module.');
if (!html.includes('src/ui/app.css')) fail('index.html must load the shared v3 stylesheet.');

const legacyNames = ['app.js','runtime-safety.js','cloud.js','live-rooms.js','modern-home.js','journey-loop.js','runtime-recovery.js','transform-launcher.js','bq2.js'];
for (const legacy of legacyNames) if (html.includes(legacy)) fail(`Legacy runtime reference found in v3 index.html: ${legacy}`);

const srcRoot = path.join(root, 'src');
const jsFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) jsFiles.push(full);
  }
}
walk(srcRoot);

for (const file of jsFiles) {
  const rel = path.relative(root, file).replaceAll('\\','/');
  const text = fs.readFileSync(file, 'utf8');
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); }
  catch (error) { fail(`Syntax check failed: ${rel}\n${error.stderr?.toString() || error.message}`); }
  if (rel !== 'src/core/storage.js' && /\b(localStorage|sessionStorage)\b/.test(text)) fail(`Direct browser storage use outside storage service: ${rel}`);
  if (rel !== 'src/app/router.js' && /(hashchange|location\.hash|history\.(replaceState|pushState))/.test(text)) fail(`Navigation ownership leaked outside router: ${rel}`);
  if (/window\.BQ[A-Z0-9_]*/.test(text)) fail(`Legacy/global BQ namespace is forbidden in v3 source: ${rel}`);
  if (rel !== 'src/core/api.js' && /(supabase-js|createClient\s*\(|signInWithPassword|onAuthStateChange)/.test(text)) fail(`Supabase client ownership leaked outside API wrapper: ${rel}`);
}

const routerOwners = jsFiles.filter(file => /addEventListener\(['"]hashchange/.test(fs.readFileSync(file,'utf8')));
if (routerOwners.length !== 1 || path.relative(root, routerOwners[0]).replaceAll('\\','/') !== 'src/app/router.js') fail('Exactly one hashchange listener owner is required: src/app/router.js');

const sessionOwners = jsFiles.filter(file => /export function createSessionService/.test(fs.readFileSync(file,'utf8')));
if (sessionOwners.length !== 1 || path.relative(root, sessionOwners[0]).replaceAll('\\','/') !== 'src/app/session.js') fail('Exactly one session service owner is required: src/app/session.js');

const api = read('src/core/api.js');
if (!api.includes('@supabase/supabase-js@2.112.4')) fail('Supabase browser dependency must remain pinned to 2.112.4 for this milestone.');
if (!api.includes("signOut({ scope: 'local' })")) fail('Session sign-out must be device-local, not global.');
if (/service_role|sb_secret_/i.test(api)) fail('Privileged Supabase credentials are forbidden in browser code.');

const inventory = read('FEATURE_INVENTORY_V3.md');
for (const status of ['Not started','Implemented','Verified','Regression-tested']) if (!inventory.includes(status)) fail(`Feature inventory is missing required status: ${status}`);
if (/Compatibility\s*\|\s*(Verified|Regression-tested)/i.test(inventory)) fail('Compatibility access cannot be marked Verified or Regression-tested.');

if (failures.length) {
  console.error(`BibleQuest v3 architecture validation FAILED (${failures.length})`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log('BibleQuest v3 architecture validation passed.');
console.log(`Checked ${jsFiles.length} v3 JavaScript modules.`);
console.log('Single boot, router, store/storage, API and session ownership confirmed; legacy BQ globals remain excluded.');

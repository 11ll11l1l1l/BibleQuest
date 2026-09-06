import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const fail = message => failures.push(message);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const required = ['index.html','src/app/bootstrap.js','src/app/router.js','src/app/store.js','src/app/session.js','src/app/account.js','src/app/reader.js','src/core/storage.js','src/core/api.js','src/core/bible.js','src/ui/shell.js','src/ui/app.css','src/ui/reader.css','src/features/home/index.js','src/features/account/index.js','src/features/learn/index.js','src/features/reader/index.js','FEATURE_INVENTORY_V3.md','DEVELOPMENT_STATUS_V3.md','ARCHITECTURE_V3.md','data/packs/ATTRIBUTION.md'];
for (const file of required) if (!fs.existsSync(path.join(root, file))) fail(`Missing v3 required file: ${file}`);

const html = read('index.html');
const scriptTags = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
if (scriptTags.length !== 1 || scriptTags[0] !== 'src/app/bootstrap.js') fail(`index.html must boot exactly one script entry. Found: ${scriptTags.join(', ') || 'none'}`);
if (!/type=["']module["']/.test(html)) fail('v3 bootstrap must be loaded as an ES module.');
if (!html.includes('src/ui/app.css') || !html.includes('src/ui/reader.css')) fail('index.html must load shared v3 shell and reader stylesheets.');
const legacyNames = ['app.js','runtime-safety.js','cloud.js','live-rooms.js','modern-home.js','journey-loop.js','runtime-recovery.js','transform-launcher.js','bq2.js'];
for (const legacy of legacyNames) if (html.includes(legacy)) fail(`Legacy runtime reference found in v3 index.html: ${legacy}`);

const srcRoot = path.join(root, 'src');
const jsFiles = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (entry.name.endsWith('.js')) jsFiles.push(full); } }
walk(srcRoot);
for (const file of jsFiles) {
  const rel = path.relative(root, file).replaceAll('\\','/');
  const text = fs.readFileSync(file, 'utf8');
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch (error) { fail(`Syntax check failed: ${rel}\n${error.stderr?.toString() || error.message}`); }
  if (rel !== 'src/core/storage.js' && /\b(localStorage|sessionStorage)\b/.test(text)) fail(`Direct browser storage use outside storage service: ${rel}`);
  if (rel !== 'src/app/router.js' && /(hashchange|location\.hash|history\.(replaceState|pushState))/.test(text)) fail(`Navigation ownership leaked outside router: ${rel}`);
  if (/window\.BQ[A-Z0-9_]*/.test(text)) fail(`Legacy/global BQ namespace is forbidden in v3 source: ${rel}`);
  if (rel !== 'src/core/api.js' && /(supabase-js|createClient\s*\(|signInWithPassword|onAuthStateChange|bq-signup|bq-password-reset|bible_devices)/.test(text)) fail(`Account/backend ownership leaked outside API wrapper: ${rel}`);
  if (rel !== 'src/core/bible.js' && /data\/packs\/(?:bible|tagalog)\//.test(text)) fail(`Bible pack ownership leaked outside Bible data service: ${rel}`);
}
const routerOwners = jsFiles.filter(file => /addEventListener\(['"]hashchange/.test(fs.readFileSync(file,'utf8')));
if (routerOwners.length !== 1 || path.relative(root, routerOwners[0]).replaceAll('\\','/') !== 'src/app/router.js') fail('Exactly one hashchange listener owner is required: src/app/router.js');
const sessionOwners = jsFiles.filter(file => /export function createSessionService/.test(fs.readFileSync(file,'utf8')));
if (sessionOwners.length !== 1 || path.relative(root, sessionOwners[0]).replaceAll('\\','/') !== 'src/app/session.js') fail('Exactly one session service owner is required: src/app/session.js');
const accountOwners = jsFiles.filter(file => /export function createAccountService/.test(fs.readFileSync(file,'utf8')));
if (accountOwners.length !== 1 || path.relative(root, accountOwners[0]).replaceAll('\\','/') !== 'src/app/account.js') fail('Exactly one account workflow owner is required: src/app/account.js');
const bibleOwners = jsFiles.filter(file => /export function createBibleDataService/.test(fs.readFileSync(file,'utf8')));
if (bibleOwners.length !== 1 || path.relative(root, bibleOwners[0]).replaceAll('\\','/') !== 'src/core/bible.js') fail('Exactly one Bible data-service owner is required: src/core/bible.js');
const readerOwners = jsFiles.filter(file => /export function createReaderService/.test(fs.readFileSync(file,'utf8')));
if (readerOwners.length !== 1 || path.relative(root, readerOwners[0]).replaceAll('\\','/') !== 'src/app/reader.js') fail('Exactly one reader-state owner is required: src/app/reader.js');

const api = read('src/core/api.js');
if (!api.includes('@supabase/supabase-js@2.112.4')) fail('Supabase browser dependency must remain pinned to 2.112.4 for this milestone.');
if (!api.includes("signOut({ scope: 'local' })")) fail('Session sign-out must be device-local, not global.');
for (const contract of ["'bq-signup'","'bq-password-reset'","'bible_devices'"]) if (!api.includes(contract)) fail(`API wrapper missing required account contract ${contract}.`);
if (/service_role|sb_secret_/i.test(api)) fail('Privileged Supabase credentials are forbidden in browser code.');
const bible = read('src/core/bible.js');
for (const translation of ["id: 'bsb'","id: 'tl'"]) if (!bible.includes(translation)) fail(`Bible data service is missing bundled translation contract ${translation}.`);
if (!bible.includes('data/packs/${translation.folder}/')) fail('Bible data service must own on-demand translation pack loading.');
if (!bible.includes('https://www.esv.org/verses/') || !bible.includes('https://www.biblegateway.com/passage/') || !bible.includes('https://www.stepbible.org/')) fail('Bible data service is missing external reader/tool contracts.');
const attribution = read('data/packs/ATTRIBUTION.md');
if (!attribution.includes('Tagalog Unlocked Literal Bible') || !attribution.includes('CC BY-SA 4.0')) fail('Tagalog pack attribution/license is incomplete.');

const inventory = read('FEATURE_INVENTORY_V3.md');
const allowedStatuses = new Set(['Not started','Implemented','Verified','Regression-tested']);
for (const status of allowedStatuses) if (!inventory.includes(status)) fail(`Feature inventory is missing required status vocabulary: ${status}`);
const inventoryRows = inventory.split('\n').filter(line => /^\|\s*\d+\s*\|/.test(line));
if (inventoryRows.length !== 100) fail(`Feature inventory must contain exactly 100 numbered capability rows; found ${inventoryRows.length}.`);
inventoryRows.forEach((line, index) => { const columns = line.split('|').slice(1, -1).map(value => value.trim()); const expectedNumber = index + 1; const rowNumber = Number(columns[0]); const v3Status = columns[4]; if (rowNumber !== expectedNumber) fail(`Feature inventory row sequence error: expected ${expectedNumber}, found ${columns[0] || 'missing'}.`); if (!allowedStatuses.has(v3Status)) fail(`Feature inventory row ${columns[0] || '?'} has invalid v3 status: ${v3Status || 'missing'}.`); });
const developmentStatus = read('DEVELOPMENT_STATUS_V3.md');
if (!developmentStatus.includes('Defect / root-cause ledger')) fail('Development status must retain the root-cause ledger.');
if (!developmentStatus.includes('Next major milestone')) fail('Development status must retain the next-work queue.');
const architecture = read('ARCHITECTURE_V3.md');
if (!architecture.includes('src/core/bible.js') || !architecture.includes('src/app/reader.js')) fail('Architecture document must name the active Bible-data and reader-state owners.');

if (failures.length) { console.error(`BibleQuest v3 architecture validation FAILED (${failures.length})`); failures.forEach(message => console.error(`- ${message}`)); process.exit(1); }
console.log('BibleQuest v3 architecture validation passed.');
console.log(`Checked ${jsFiles.length} v3 JavaScript modules and ${inventoryRows.length} feature-inventory rows.`);
console.log('Single boot, router, store/storage, API, session, account, Bible-data and reader-state ownership confirmed.');

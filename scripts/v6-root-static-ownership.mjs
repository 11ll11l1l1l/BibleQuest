import { access, readFile, readdir, stat } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, 'dist-v6');
const requiredRootStatic = ['_headers','_redirects','app-icon.svg','manifest.webmanifest','offline-shell-sw.js','pwa-icon-192.png','pwa-icon-512.png','pwa-icon-maskable-512.png'];

async function sameBytes(source, target) {
  const [sourceInfo, targetInfo] = await Promise.all([stat(source), stat(target)]);
  if (sourceInfo.size !== targetInfo.size) return false;
  const [sourceBytes, targetBytes] = await Promise.all([readFile(source), readFile(target)]);
  return sourceBytes.equals(targetBytes);
}
async function outputRefExists(ref) {
  if (!ref || ref.startsWith('#') || /^https?:/i.test(ref)) return false;
  const withoutHash = ref.split('#')[0].split('?')[0];
  const relativePath = withoutHash.replace(/^\.\//, '').replace(/^\//, '');
  if (!relativePath || relativePath.includes('..')) return false;
  try { await access(resolve(outDir, relativePath)); return true; } catch { return false; }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const missingSource = [], missingBuilt = [], changed = [];
let totalBytes = 0;
for (const relativePath of requiredRootStatic) {
  const source = resolve(root, relativePath), target = resolve(outDir, relativePath);
  try { await access(source); } catch { missingSource.push(relativePath); continue; }
  try { await access(target); } catch { missingBuilt.push(relativePath); continue; }
  totalBytes += (await stat(target)).size;
  if (!(await sameBytes(source, target))) changed.push(relativePath);
}

let manifest;
try { manifest = JSON.parse(await readFile(resolve(outDir, 'manifest.webmanifest'), 'utf8')); }
catch (error) { throw new Error(`V6 root static ownership failed: built manifest is unreadable: ${error.message}`); }

const manifestRefs = [
  ...(Array.isArray(manifest.icons) ? manifest.icons.map((icon) => icon?.src) : []),
  ...(Array.isArray(manifest.shortcuts) ? manifest.shortcuts.flatMap((shortcut) => [shortcut?.url, ...(shortcut?.icons || []).map((icon) => icon?.src)]) : []),
].filter((value) => typeof value === 'string' && value.length > 0);
const missingManifestTargets = [];
for (const ref of manifestRefs) {
  if (ref.startsWith('#') || /^https?:/i.test(ref)) continue;
  const withoutHash = ref.split('#')[0].split('?')[0];
  if (!withoutHash || withoutHash === './' || withoutHash === '.') continue;
  const relativePath = withoutHash.replace(/^\.\//, '').replace(/^\//, '');
  if (!relativePath || relativePath.includes('..')) { missingManifestTargets.push(`${ref} (unsafe)`); continue; }
  if (!(await outputRefExists(ref))) missingManifestTargets.push(ref);
}

// Vite rewrites index-linked assets to hashed _v6/ URLs. Validate semantic link
// roles and their emitted targets rather than requiring source filenames in HTML.
const builtIndex = await readFile(resolve(outDir, 'index.html'), 'utf8');
const linkTags = [...builtIndex.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
function linkHrefForRel(rel) {
  const tag = linkTags.find((candidate) => candidate.match(/\brel=["']([^"']+)["']/i)?.[1].split(/\s+/).includes(rel));
  return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1] || null;
}
const builtIndexRefs = { manifest: linkHrefForRel('manifest'), icon: linkHrefForRel('icon'), appleTouchIcon: linkHrefForRel('apple-touch-icon') };
const missingIndexRefs = [];
for (const [role, ref] of Object.entries(builtIndexRefs)) {
  if (!ref) { missingIndexRefs.push(`${role} (missing link)`); continue; }
  if (!(await outputRefExists(ref))) missingIndexRefs.push(`${role}: ${ref} (missing target)`);
}

// Public client artifacts must never contain privileged server credentials. Scan
// emitted text, not source, so this guards the actual deployable Vite artifact.
const privilegedSecretPatterns = [
  ['Supabase service-role env name', /SUPABASE_SERVICE_ROLE_KEY/i],
  ['generic service-role key name', /SERVICE_ROLE_KEY/i],
  ['private key PEM', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['VAPID private key name', /VAPID_PRIVATE_KEY/i],
  ['database password env name', /(?:POSTGRES|DATABASE)_PASSWORD/i],
];
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.svg', '.txt', '.webmanifest']);
const privilegedSecretMarkers = [];
for (const path of await listFiles(outDir)) {
  if (!textExtensions.has(extname(path).toLowerCase()) && basename(path) !== '_headers' && basename(path) !== '_redirects') continue;
  const content = await readFile(path, 'utf8');
  for (const [label, pattern] of privilegedSecretPatterns) {
    if (pattern.test(content)) privilegedSecretMarkers.push(`${path.slice(outDir.length + 1)}: ${label}`);
  }
}

const report = { ownership:'vite-root-static-compatibility-copy', requiredFiles:requiredRootStatic.map((path)=>basename(path)), totalBytes, manifestIconCount:Array.isArray(manifest.icons)?manifest.icons.length:0, manifestShortcutCount:Array.isArray(manifest.shortcuts)?manifest.shortcuts.length:0, missingSource, missingBuilt, changed, missingManifestTargets, builtIndexRefs, missingIndexRefs, privilegedSecretMarkers };
console.log(JSON.stringify(report, null, 2));
const failures = [];
if (missingSource.length) failures.push(`required source files missing: ${missingSource.join(', ')}`);
if (missingBuilt.length) failures.push(`required files missing from dist-v6: ${missingBuilt.join(', ')}`);
if (changed.length) failures.push(`root static output differs from source: ${changed.join(', ')}`);
if (missingManifestTargets.length) failures.push(`manifest targets missing/unsafe: ${missingManifestTargets.join(', ')}`);
if (missingIndexRefs.length) failures.push(`built index PWA links invalid: ${missingIndexRefs.join(', ')}`);
if (privilegedSecretMarkers.length) failures.push(`privileged secret markers present in public client artifact: ${privilegedSecretMarkers.join(', ')}`);
if (!Array.isArray(manifest.icons) || manifest.icons.length < 3) failures.push('manifest icon inventory is incomplete');
if (!Array.isArray(manifest.shortcuts) || manifest.shortcuts.length < 4) failures.push('manifest shortcut inventory is incomplete');
if (failures.length) throw new Error(`V6 root static ownership failed: ${failures.join('; ')}`);

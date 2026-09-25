import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const sourceRoot = resolve(root, 'src/v6');
const testRoot = resolve(root, 'tests/v6');
const extensions = new Set(['.ts', '.tsx']);
const forbiddenRuntimePatterns = Object.freeze([
  { pattern: /\beval\s*\(/, label: 'eval() is forbidden in V6 client source' },
  { pattern: /\bnew\s+Function\s*\(/, label: 'new Function() is forbidden in V6 client source' },
  { pattern: /\bdocument\.write\s*\(/, label: 'document.write() is forbidden in V6 client source' },
  { pattern: /\bservice[_-]?role\b/i, label: 'service-role material must never enter V6 client source' },
  { pattern: /\bsb_secret_[A-Za-z0-9_-]*/i, label: 'Supabase secret keys must never enter V6 client source' },
  { pattern: /\bvapid[_-]?private\b/i, label: 'VAPID private-key material must never enter V6 client source' },
  { pattern: /BEGIN [A-Z ]*PRIVATE KEY/, label: 'private PEM material must never enter V6 client source' },
  { pattern: /supabase\/functions\//, label: 'V6 client source must not import server function implementation files' },
]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

const files = (await walk(sourceRoot)).sort();
const testFiles = (await walk(testRoot)).sort();
const failures = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const display = relative(root, file).replaceAll('\\', '/');
  for (const rule of forbiddenRuntimePatterns) {
    if (rule.pattern.test(content)) failures.push(`${display}: ${rule.label}`);
  }
}

for (const file of testFiles) {
  const content = await readFile(file, 'utf8');
  const display = relative(root, file).replaceAll('\\', '/');
  if (/\bfrom\s+['"]vitest['"]|\brequire\s*\(\s*['"]vitest['"]\s*\)/.test(content)) {
    failures.push(`${display}: Vitest is not installed in the deterministic V6 CI environment; use node:test and node:assert/strict`);
  }
}

if (!files.length) failures.push('src/v6 must contain lintable TypeScript source files');

if (failures.length) {
  console.error('V6 lint policy failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`PASS V6 lint policy (${files.length} source files; ${testFiles.length} V6 test files)`);
}

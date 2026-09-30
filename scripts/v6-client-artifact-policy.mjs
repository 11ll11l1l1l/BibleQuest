import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TARGETS = [
  'index.html',
  'src',
  'public',
  'dist-v6',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
];
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.css', '.svg']);

const FORBIDDEN_MARKERS = [
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /SERVICE_ROLE_KEY/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
];

const CREDENTIAL_LITERALS = [
  /(?:service[_-]?role|secret)[_-]?(?:key|token)\s*[:=]\s*["'`][^"'`\r\n]{20,}["'`]/i,
];


const CSP_REQUIRED_DIRECTIVES = Object.freeze({
  "default-src": ["'self'"], "base-uri": ["'self'"], "object-src": ["'none'"],
  "frame-ancestors": ["'self'"], "script-src": ["'self'", 'https://cdn.jsdelivr.net'],
  "style-src": ["'self'"],
  "connect-src": ["'self'", 'https://zkfmgezvzugchcwppreq.supabase.co', 'wss://zkfmgezvzugchcwppreq.supabase.co', 'https://openbible.com'],
  "media-src": ["'self'", 'blob:', 'https://openbible.com'],
  "worker-src": ["'self'", 'blob:'], "manifest-src": ["'self'"], "form-action": ["'self'"],
});
export function validateCspHeader(source) {
  const line = String(source || '').split(/\r?\n/).find(row => /^\s*Content-Security-Policy:/i.test(row));
  if (!line) return ['missing Content-Security-Policy header'];
  const directives = new Map(line.replace(/^\s*Content-Security-Policy:\s*/i, '').split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const [name, ...values] = part.split(/\s+/); return [name.toLowerCase(), new Set(values)];
  }));
  const errors = [];
  for (const [name, required] of Object.entries(CSP_REQUIRED_DIRECTIVES)) {
    const actual = directives.get(name);
    if (!actual) { errors.push('missing ' + name); continue; }
    for (const value of required) if (!actual.has(value)) errors.push(name + ' missing ' + value);
  }
  for (const name of ['script-src','style-src']) {
    const actual = directives.get(name) || new Set();
    for (const unsafe of ["'unsafe-inline'", "'unsafe-eval'"]) if (actual.has(unsafe)) errors.push(name + ' permits ' + unsafe);
  }
  return errors;
}

const JWT_LITERAL_PATTERN = /["'`](eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)["'`]/g;

function isTextCandidate(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function collectFiles(targetPath) {
  let info;
  try {
    info = await stat(targetPath);
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
  if (info.isFile()) return isTextCandidate(targetPath) ? [targetPath] : [];
  if (!info.isDirectory()) return [];

  const entries = await readdir(targetPath, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    return collectFiles(path.join(targetPath, entry.name));
  }));
  return nested.flat();
}

function jwtPayload(token) {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return null;
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function jwtExposureLabel(token) {
  const payload = jwtPayload(token);
  if (payload?.role === 'anon') return null;
  const role = typeof payload?.role === 'string' && payload.role.trim() ? payload.role.trim() : 'unknown';
  return `jwt-literal:${role}`;
}

export function findClientCredentialExposure(source) {
  const matches = [];
  for (const pattern of [...FORBIDDEN_MARKERS, ...CREDENTIAL_LITERALS]) {
    if (pattern.test(source)) matches.push(pattern.source);
  }
  for (const match of source.matchAll(JWT_LITERAL_PATTERN)) {
    const label = jwtExposureLabel(match[1]);
    if (label) matches.push(label);
  }
  return [...new Set(matches)];
}

export async function scanClientArtifactInputs(rootDir, targets = DEFAULT_TARGETS) {
  const files = (await Promise.all(targets.map((target) => collectFiles(path.join(rootDir, target))))).flat();
  const findings = [];
  for (const filePath of files.sort()) {
    const source = await readFile(filePath, 'utf8');
    const matches = findClientCredentialExposure(source);
    if (matches.length) findings.push({ file: path.relative(rootDir, filePath), matches });
  }
  return findings;
}

async function main() {
  const rootDir = process.cwd();
  const cspFindings = validateCspHeader(await readFile(path.join(rootDir, '_headers'), 'utf8'));
  if (cspFindings.length) {
    console.error('V6 CSP policy failed: ' + cspFindings.join('; '));
    process.exitCode = 1;
    return;
  }
  const findings = await scanClientArtifactInputs(rootDir);
  if (findings.length) {
    console.error('V6 client artifact policy failed. Browser-shipped inputs contain privileged credential material.');
    for (const finding of findings) console.error(`- ${finding.file}: ${finding.matches.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log('V6 client artifact policy PASS: no privileged credential material found in browser-shipped inputs or built artifacts.');
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();

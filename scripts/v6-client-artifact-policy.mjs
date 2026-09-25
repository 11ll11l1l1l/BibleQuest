import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TARGETS = ['index.html', 'src', 'public', 'vite.config.js', 'vite.config.mjs', 'vite.config.ts'];
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.css', '.svg']);

const FORBIDDEN_MARKERS = [
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /SERVICE_ROLE_KEY/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
];

const CREDENTIAL_LITERALS = [
  /(?:service[_-]?role|secret)[_-]?(?:key|token)\s*[:=]\s*["'`][^"'`\r\n]{20,}["'`]/i,
  /["'`]eyJ[a-zA-Z0-9_-]{16,}\.[a-zA-Z0-9_-]{16,}\.[a-zA-Z0-9_-]{16,}["'`]/,
];

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

export function findClientCredentialExposure(source) {
  const matches = [];
  for (const pattern of [...FORBIDDEN_MARKERS, ...CREDENTIAL_LITERALS]) {
    if (pattern.test(source)) matches.push(pattern.source);
  }
  return matches;
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
  const findings = await scanClientArtifactInputs(rootDir);
  if (findings.length) {
    console.error('V6 client artifact policy failed. Browser-shipped inputs contain privileged credential material.');
    for (const finding of findings) console.error(`- ${finding.file}: ${finding.matches.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log('V6 client artifact policy PASS: no privileged credential material found in browser-shipped inputs.');
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) await main();

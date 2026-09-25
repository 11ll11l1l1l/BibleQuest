import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const PRIVATE_PUSH_MARKERS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEYS',
  'SUPABASE_DB_URL',
  'VAPID_PRIVATE_KEY',
  'bq_vapid_config',
] as const;

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.json', '.html', '.css', '.md', '.webmanifest', '.svg', '.txt',
]);

function textFilesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(root)) {
    const target = path.join(root, entry);
    const stat = statSync(target);
    if (stat.isDirectory()) {
      out.push(...textFilesUnder(target));
      continue;
    }
    if (stat.isFile() && TEXT_EXTENSIONS.has(path.extname(target).toLowerCase())) {
      out.push(target);
    }
  }
  return out;
}

function browserReachableSourceFiles(): string[] {
  const roots = ['src', 'public'];
  const explicit = [
    'index.html',
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.js',
    'vite.config.mjs',
  ];
  return [
    ...roots.flatMap(textFilesUnder),
    ...explicit.filter(existsSync),
  ];
}

test('push private configuration markers remain outside browser-reachable source/config', () => {
  const leaks: string[] = [];
  for (const file of browserReachableSourceFiles()) {
    const source = readFileSync(file, 'utf8');
    for (const marker of PRIVATE_PUSH_MARKERS) {
      if (source.includes(marker)) leaks.push(`${file}: ${marker}`);
    }
  }

  assert.deepEqual(
    leaks,
    [],
    `private push/server configuration marker leaked into browser-reachable source:\n${leaks.join('\n')}`,
  );
});

test('push delivery obtains privileged material only from server environment or Vault', () => {
  const serverFile = 'supabase/functions/bq-push-delivery/index.ts';
  const source = readFileSync(serverFile, 'utf8');

  assert.match(source, /Deno\.env\.get\(['"]SUPABASE_SERVICE_ROLE_KEY['"]\)/);
  assert.match(source, /Deno\.env\.get\(['"]SUPABASE_SECRET_KEYS['"]\)/);
  assert.match(source, /Deno\.env\.get\(['"]SUPABASE_DB_URL['"]\)/);
  assert.match(source, /Deno\.env\.get\(['"]VAPID_PRIVATE_KEY['"]\)/);
  assert.match(source, /vault\.decrypted_secrets/);
  assert.match(source, /name\s*=\s*['"]bq_vapid_config['"]/);
});

test('public VAPID material is not confused with the private-key contract', () => {
  const serverFile = 'supabase/functions/bq-push-delivery/index.ts';
  const source = readFileSync(serverFile, 'utf8');

  assert.match(source, /Deno\.env\.get\(['"]VAPID_PUBLIC_KEY['"]\)/);
  assert.equal(PRIVATE_PUSH_MARKERS.includes('VAPID_PUBLIC_KEY' as never), false);
});

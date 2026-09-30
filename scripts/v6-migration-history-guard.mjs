import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATION_FILE = /^(\d{14})_([a-z0-9][a-z0-9_]*)\.sql$/;

export function parseMigrationFilename(filename) {
  const match = MIGRATION_FILE.exec(String(filename || ''));
  if (!match) throw new Error(`Invalid Supabase migration filename: ${filename}`);
  return Object.freeze({ version: match[1], name: match[2], filename });
}

export function normalizeRemoteMigrations(value) {
  const rows = Array.isArray(value) ? value : value?.migrations;
  if (!Array.isArray(rows)) {
    throw new Error('Remote migration evidence must be an array or an object with a migrations array.');
  }
  return rows.map((row, index) => {
    const version = String(row?.version || '').trim();
    const name = String(row?.name || '').trim();
    if (!/^\d{14}$/.test(version)) {
      throw new Error(`Remote migration at index ${index} has an invalid version: ${version || '<missing>'}`);
    }
    if (!/^[a-z0-9][a-z0-9_]*$/.test(name)) {
      throw new Error(`Remote migration at index ${index} has an invalid name: ${name || '<missing>'}`);
    }
    return Object.freeze({ version, name });
  });
}

function indexUnique(rows, key, label) {
  const out = new Map();
  for (const row of rows) {
    const value = row[key];
    if (out.has(value)) throw new Error(`${label} repeats ${key} ${value}`);
    out.set(value, row);
  }
  return out;
}

export function analyzeMigrationHistory(localRows, remoteRows = []) {
  const localByVersion = indexUnique(localRows, 'version', 'Local migration history');
  const localByName = indexUnique(localRows, 'name', 'Local migration history');
  const remoteByVersion = indexUnique(remoteRows, 'version', 'Remote migration history');
  const remoteByName = indexUnique(remoteRows, 'name', 'Remote migration history');

  const versionMismatches = [];
  for (const local of localRows) {
    const remote = remoteByName.get(local.name);
    if (remote && remote.version !== local.version) {
      versionMismatches.push(Object.freeze({
        name: local.name,
        localVersion: local.version,
        remoteVersion: remote.version,
      }));
    }
  }

  const remoteOnly = remoteRows
    .filter(remote => !localByName.has(remote.name))
    .map(remote => Object.freeze({ ...remote }));

  const pending = localRows
    .filter(local => !remoteByName.has(local.name))
    .map(local => Object.freeze({ ...local }));

  const latestRemoteVersion = remoteRows.reduce(
    (latest, row) => (row.version > latest ? row.version : latest),
    '',
  );
  const outOfOrderPending = latestRemoteVersion
    ? pending.filter(row => row.version < latestRemoteVersion)
    : [];

  const sameVersionDifferentName = [];
  for (const local of localRows) {
    const remote = remoteByVersion.get(local.version);
    if (remote && remote.name !== local.name) {
      sameVersionDifferentName.push(Object.freeze({
        version: local.version,
        localName: local.name,
        remoteName: remote.name,
      }));
    }
  }

  const blockers = [];
  if (versionMismatches.length) blockers.push('logical migration names are recorded remotely under different versions');
  if (sameVersionDifferentName.length) blockers.push('the same migration version maps to different logical names');
  if (remoteOnly.length) blockers.push('remote migration history contains logical migrations absent from the repository');
  if (outOfOrderPending.length) blockers.push('older local migrations are unapplied behind the latest remote migration version');

  return Object.freeze({
    localCount: localRows.length,
    remoteCount: remoteRows.length,
    latestRemoteVersion: latestRemoteVersion || null,
    pending,
    outOfOrderPending,
    versionMismatches,
    sameVersionDifferentName,
    remoteOnly,
    safeForOrderedPush: blockers.length === 0,
    blockers,
  });
}

export async function readLocalMigrations(directory = 'supabase/migrations') {
  const names = (await readdir(directory))
    .filter(name => name.endsWith('.sql'))
    .sort();
  return names.map(parseMigrationFilename);
}

export async function loadRemoteMigrationEvidence(path) {
  const body = await readFile(path, 'utf8');
  let value;
  try {
    value = JSON.parse(body);
  } catch {
    throw new Error(`Remote migration evidence is not valid JSON: ${path}`);
  }
  return normalizeRemoteMigrations(value);
}

function printReport(report) {
  console.log(JSON.stringify(report, null, 2));
}

function parseArgs(argv) {
  const args = { localOnly: false, remoteJson: null, migrationsDir: 'supabase/migrations' };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--local-only') args.localOnly = true;
    else if (value === '--remote-json') args.remoteJson = argv[++i];
    else if (value === '--migrations-dir') args.migrationsDir = argv[++i];
    else if (value === '--help') args.help = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!args.localOnly && !args.remoteJson && !args.help) {
    throw new Error('Use --local-only or provide --remote-json <file>.');
  }
  if (args.localOnly && args.remoteJson) {
    throw new Error('--local-only and --remote-json are mutually exclusive.');
  }
  return args;
}

function usage() {
  return [
    'BibleQuest V6 migration-history preflight',
    '',
    'Local repository validation:',
    '  node scripts/v6-migration-history-guard.mjs --local-only',
    '',
    'Release/staging comparison:',
    '  node scripts/v6-migration-history-guard.mjs --remote-json /path/to/remote-migrations.json',
    '',
    'Remote JSON must contain [{"version":"YYYYMMDDHHMMSS","name":"migration_name"}]',
    'or {"migrations":[...]} from a reviewed migration-history export.',
    '',
    'A non-zero exit means migration history is unsafe for an ordered push. The guard never repairs or applies migrations.',
  ].join('\n');
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  Promise.resolve().then(async () => {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
      return;
    }
    const local = await readLocalMigrations(args.migrationsDir);
    const remote = args.localOnly ? [] : await loadRemoteMigrationEvidence(args.remoteJson);
    const report = analyzeMigrationHistory(local, remote);
    printReport(report);
    if (!args.localOnly && !report.safeForOrderedPush) process.exitCode = 1;
  }).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}

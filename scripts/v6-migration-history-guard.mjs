import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATION_FILE = /^(\d{8}|\d{14})_([a-z0-9][a-z0-9_]*)\.sql$/;
export const V5_RELEASE_CUTOFF = '20260918235959';

export function parseMigrationFilename(filename) {
  const match = MIGRATION_FILE.exec(String(filename || ''));
  if (!match) throw new Error(`Invalid Supabase migration filename: ${filename}`);
  const sourceVersion = match[1];
  const version = sourceVersion.length === 8 ? `${sourceVersion}000000` : sourceVersion;
  return Object.freeze({ version, sourceVersion, name: match[2], filename });
}

export function normalizeRemoteMigrations(value) {
  const rows = Array.isArray(value) ? value : value?.migrations;
  if (!Array.isArray(rows)) {
    throw new Error('Remote migration evidence must be an array or an object with a migrations array.');
  }
  return rows.map((row, index) => {
    const version = String(row?.version || '').trim();
    const name = String(row?.name || '').trim();
    if (!/^(?:\d{8}|\d{14})$/.test(version)) {
      throw new Error(`Remote migration at index ${index} has an invalid version: ${version || '<missing>'}`);
    }
    if (!/^[a-z0-9][a-z0-9_]*$/.test(name)) {
      throw new Error(`Remote migration at index ${index} has an invalid name: ${name || '<missing>'}`);
    }
    const normalizedVersion = version.length === 8 ? `${version}000000` : version;
    return Object.freeze({ version: normalizedVersion, sourceVersion: version, name });
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

export function analyzeMigrationHistory(localRows, remoteRows = [], { cutoff = V5_RELEASE_CUTOFF } = {}) {
  const localForward = localRows.filter(row => row.version > cutoff);
  const remoteForward = remoteRows.filter(row => row.version > cutoff);
  for (const row of localForward) {
    if (String(row.sourceVersion || row.version).length !== 14) {
      throw new Error(`V6 forward migration must use a unique 14-digit version: ${row.filename || row.name}`);
    }
  }
  const localByVersion = indexUnique(localForward, 'version', 'Local migration history');
  const localByName = indexUnique(localForward, 'name', 'Local migration history');
  const remoteByVersion = indexUnique(remoteForward, 'version', 'Remote migration history');
  const remoteByName = indexUnique(remoteForward, 'name', 'Remote migration history');

  const versionMismatches = [];
  for (const local of localForward) {
    const remote = remoteByName.get(local.name);
    if (remote && remote.version !== local.version) {
      versionMismatches.push(Object.freeze({
        name: local.name,
        localVersion: local.version,
        remoteVersion: remote.version,
      }));
    }
  }

  const remoteOnly = remoteForward
    .filter(remote => !localByName.has(remote.name))
    .map(remote => Object.freeze({ ...remote }));

  const pending = localForward
    .filter(local => !remoteByName.has(local.name))
    .map(local => Object.freeze({ ...local }));

  const latestRemoteVersion = remoteForward.reduce(
    (latest, row) => (row.version > latest ? row.version : latest),
    '',
  );
  const outOfOrderPending = latestRemoteVersion
    ? pending.filter(row => row.version < latestRemoteVersion)
    : [];

  const sameVersionDifferentName = [];
  for (const local of localForward) {
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
    cutoff,
    localCount: localForward.length,
    remoteCount: remoteForward.length,
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

export function analyzeReleaseTarget(localRows, remoteRows, targetName, options = {}) {
  const name = String(targetName || '').trim();
  if (!/^[a-z0-9][a-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid release target migration name: ${name || '<missing>'}`);
  }

  const cutoff = options.cutoff || V5_RELEASE_CUTOFF;
  const history = analyzeMigrationHistory(localRows, remoteRows, { cutoff });
  const localTarget = localRows.find(row => row.version > cutoff && row.name === name);
  if (!localTarget) {
    throw new Error(`Release target migration is missing from the V6 forward inventory: ${name}`);
  }

  const remoteTarget = remoteRows.find(row => row.version > cutoff && row.name === name) || null;
  const appliedExact = Boolean(remoteTarget && remoteTarget.version === localTarget.version);
  const pendingExact = history.pending.some(row => row.name === name && row.version === localTarget.version);
  const safeForReleaseTarget = history.safeForOrderedPush && (appliedExact || pendingExact);

  return Object.freeze({
    ...history,
    safeForReleaseTarget,
    releaseTarget: Object.freeze({
      name,
      version: localTarget.version,
      status: appliedExact ? 'applied' : pendingExact ? 'pending' : 'blocked',
      appliedExact,
      pendingExact,
      remoteVersion: remoteTarget?.version || null,
    }),
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
  const args = { localOnly: false, remoteJson: null, migrationsDir: 'supabase/migrations', releaseTarget: null };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--local-only') args.localOnly = true;
    else if (value === '--remote-json') args.remoteJson = argv[++i];
    else if (value === '--migrations-dir') args.migrationsDir = argv[++i];
    else if (value === '--require-target') args.releaseTarget = argv[++i];
    else if (value === '--help') args.help = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!args.localOnly && !args.remoteJson && !args.help) {
    throw new Error('Use --local-only or provide --remote-json <file>.');
  }
  if (args.localOnly && args.remoteJson) {
    throw new Error('--local-only and --remote-json are mutually exclusive.');
  }
  if (args.releaseTarget && args.localOnly) {
    throw new Error('--require-target needs --remote-json because release safety depends on remote history.');
  }
  if (args.releaseTarget && !args.remoteJson && !args.help) {
    throw new Error('--require-target needs --remote-json <file>.');
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
    'Named release-target preflight:',
    '  node scripts/v6-migration-history-guard.mjs --require-target assignment_due_reminders --remote-json /path/to/remote-migrations.json',
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
    const report = args.releaseTarget
      ? analyzeReleaseTarget(local, remote, args.releaseTarget)
      : analyzeMigrationHistory(local, remote);
    printReport(report);
    if (!args.localOnly && !(args.releaseTarget ? report.safeForReleaseTarget : report.safeForOrderedPush)) process.exitCode = 1;
  }).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}

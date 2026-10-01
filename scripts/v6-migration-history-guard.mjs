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

function normalizeMigrationVersion(value, label) {
  const version = String(value || '').trim();
  if (!/^(?:\d{8}|\d{14})$/.test(version)) {
    throw new Error(`${label} has an invalid migration version: ${version || '<missing>'}`);
  }
  return version.length === 8 ? `${version}000000` : version;
}

function normalizeMigrationName(value, label) {
  const name = String(value || '').trim();
  if (!/^[a-z0-9][a-z0-9_]*$/.test(name)) {
    throw new Error(`${label} has an invalid migration name: ${name || '<missing>'}`);
  }
  return name;
}

export function normalizeMigrationEquivalences(value) {
  const rows = Array.isArray(value) ? value : value?.equivalences;
  if (!Array.isArray(rows)) {
    throw new Error('Migration equivalence evidence must be an array or an object with an equivalences array.');
  }
  return rows.map((row, index) => {
    const label = `Migration equivalence at index ${index}`;
    const remoteVersion = normalizeMigrationVersion(row?.remoteVersion, label);
    const localVersion = normalizeMigrationVersion(row?.localVersion, label);
    const remoteName = normalizeMigrationName(row?.remoteName, label);
    const localName = normalizeMigrationName(row?.localName, label);
    const evidence = String(row?.evidence || '').trim();
    if (row?.reviewed !== true) {
      throw new Error(`${label} must set reviewed=true; unreviewed history repair mappings are never accepted.`);
    }
    if (!evidence) {
      throw new Error(`${label} must cite the schema-equivalence evidence used to justify metadata-only repair.`);
    }
    if (remoteVersion === localVersion) {
      throw new Error(`${label} must map different migration versions; same-version name conflicts require manual resolution.`);
    }
    return Object.freeze({ remoteVersion, remoteName, localVersion, localName, reviewed: true, evidence });
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

export function analyzeMigrationHistory(localRows, remoteRows = [], { cutoff = V5_RELEASE_CUTOFF, equivalences = [] } = {}) {
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
  const reviewedEquivalences = normalizeMigrationEquivalences(equivalences);
  const mappedLocalKeys = new Set();
  const mappedRemoteKeys = new Set();
  const historyRepairs = [];

  for (const mapping of reviewedEquivalences) {
    const local = localByVersion.get(mapping.localVersion);
    const remote = remoteByVersion.get(mapping.remoteVersion);
    if (!local || local.name !== mapping.localName) {
      throw new Error(`Reviewed equivalence does not match local migration history: ${mapping.localVersion}_${mapping.localName}`);
    }
    if (!remote || remote.name !== mapping.remoteName) {
      throw new Error(`Reviewed equivalence does not match remote migration history: ${mapping.remoteVersion}_${mapping.remoteName}`);
    }
    const localKey = `${local.version}:${local.name}`;
    const remoteKey = `${remote.version}:${remote.name}`;
    if (mappedLocalKeys.has(localKey) || mappedRemoteKeys.has(remoteKey)) {
      throw new Error(`Migration equivalence mappings must be one-to-one: ${remoteKey} -> ${localKey}`);
    }
    mappedLocalKeys.add(localKey);
    mappedRemoteKeys.add(remoteKey);
    historyRepairs.push(Object.freeze({
      remoteVersion: remote.version,
      remoteName: remote.name,
      localVersion: local.version,
      localName: local.name,
      evidence: mapping.evidence,
      commands: Object.freeze([
        `supabase migration repair --status reverted ${remote.sourceVersion || remote.version}`,
        `supabase migration repair --status applied ${local.sourceVersion || local.version}`,
      ]),
    }));
  }

  const isMappedLocal = row => mappedLocalKeys.has(`${row.version}:${row.name}`);
  const isMappedRemote = row => mappedRemoteKeys.has(`${row.version}:${row.name}`);

  const versionMismatches = [];
  for (const local of localForward) {
    const remote = remoteByName.get(local.name);
    if (remote && remote.version !== local.version && !isMappedLocal(local) && !isMappedRemote(remote)) {
      versionMismatches.push(Object.freeze({
        name: local.name,
        localVersion: local.version,
        remoteVersion: remote.version,
      }));
    }
  }

  const remoteOnly = remoteForward
    .filter(remote => !localByName.has(remote.name) && !isMappedRemote(remote))
    .map(remote => Object.freeze({ ...remote }));

  const pending = localForward
    .filter(local => !remoteByName.has(local.name) && !isMappedLocal(local))
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
    if (remote && remote.name !== local.name && !isMappedLocal(local) && !isMappedRemote(remote)) {
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

  const safeAfterReviewedRepairs = blockers.length === 0;
  const safeForOrderedPush = safeAfterReviewedRepairs && historyRepairs.length === 0;

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
    historyRepairs,
    requiresHistoryRepair: historyRepairs.length > 0,
    safeAfterReviewedRepairs,
    safeForOrderedPush,
    blockers,
  });
}

export function analyzeReleaseTarget(
  localRows,
  remoteRows,
  targetName,
  { cutoff = V5_RELEASE_CUTOFF, equivalences = [] } = {},
) {
  const name = String(targetName || '').trim();
  if (!/^[a-z0-9][a-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid release target migration name: ${name || '<missing>'}`);
  }

  const history = analyzeMigrationHistory(localRows, remoteRows, { cutoff, equivalences });
  const localTarget = localRows.find(row => row.version > cutoff && row.name === name);
  if (!localTarget) {
    throw new Error(`Release target migration is missing from the V6 forward inventory: ${name}`);
  }

  const remoteTarget = remoteRows.find(row => row.version > cutoff && row.name === name) || null;
  const appliedExact = Boolean(remoteTarget && remoteTarget.version === localTarget.version);
  const pendingExact = history.pending.some(row => row.name === name && row.version === localTarget.version);
  const repair = history.historyRepairs.find(
    row => row.localName === name && row.localVersion === localTarget.version,
  ) || null;
  const status = appliedExact
    ? 'applied'
    : pendingExact
      ? 'pending'
      : repair
        ? 'repair-required'
        : 'blocked';

  return Object.freeze({
    ...history,
    safeForReleaseTarget: history.safeForOrderedPush && (appliedExact || pendingExact),
    releaseTarget: Object.freeze({
      name,
      version: localTarget.version,
      status,
      appliedExact,
      pendingExact,
      remoteVersion: remoteTarget?.version || repair?.remoteVersion || null,
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

export async function loadMigrationEquivalenceEvidence(path) {
  const body = await readFile(path, 'utf8');
  let value;
  try {
    value = JSON.parse(body);
  } catch {
    throw new Error(`Migration equivalence evidence is not valid JSON: ${path}`);
  }
  return normalizeMigrationEquivalences(value);
}

function printReport(report) {
  console.log(JSON.stringify(report, null, 2));
}

function parseArgs(argv) {
  const args = {
    localOnly: false,
    remoteJson: null,
    equivalenceJson: null,
    validateRepairPlan: false,
    releaseTarget: null,
    migrationsDir: 'supabase/migrations',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--local-only') args.localOnly = true;
    else if (value === '--remote-json') args.remoteJson = argv[++i];
    else if (value === '--equivalence-json') args.equivalenceJson = argv[++i];
    else if (value === '--validate-repair-plan') args.validateRepairPlan = true;
    else if (value === '--require-target') args.releaseTarget = argv[++i];
    else if (value === '--migrations-dir') args.migrationsDir = argv[++i];
    else if (value === '--help') args.help = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!args.localOnly && !args.remoteJson && !args.help) {
    throw new Error('Use --local-only or provide --remote-json <file>.');
  }
  if (args.localOnly && (args.remoteJson || args.equivalenceJson || args.validateRepairPlan || args.releaseTarget)) {
    throw new Error('--local-only cannot be combined with remote/equivalence/release-target options.');
  }
  if (args.equivalenceJson && !args.remoteJson) {
    throw new Error('--equivalence-json requires --remote-json.');
  }
  if (args.validateRepairPlan && !args.equivalenceJson) {
    throw new Error('--validate-repair-plan requires --equivalence-json.');
  }
  if (args.releaseTarget && !args.remoteJson) {
    throw new Error('--require-target needs --remote-json <file>.');
  }
  if (args.releaseTarget && args.validateRepairPlan) {
    throw new Error('--require-target and --validate-repair-plan are separate gates; run them independently.');
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
    'Reviewed metadata-repair plan validation:',
    '  node scripts/v6-migration-history-guard.mjs --remote-json /path/to/remote.json --equivalence-json /path/to/equivalences.json --validate-repair-plan',
    '',
    'Named release-target preflight:',
    '  node scripts/v6-migration-history-guard.mjs --remote-json /path/to/remote.json --require-target assignment_due_reminders',
    '',
    'Remote JSON must contain [{"version":"YYYYMMDDHHMMSS","name":"migration_name"}]',
    'or {"migrations":[...]} from a reviewed migration-history export.',
    'Equivalence JSON must explicitly map remote/local version+name pairs, set reviewed=true,',
    'and cite independent schema-equivalence evidence. The tool only prints repair commands; it never executes them.',
    '',
    'Without --validate-repair-plan, a non-zero exit means migration history is unsafe for an ordered push.',
    'With --validate-repair-plan, exit zero means every divergence is either already aligned or covered by an exact reviewed mapping.',
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
    const equivalences = args.equivalenceJson
      ? await loadMigrationEquivalenceEvidence(args.equivalenceJson)
      : [];
    const report = args.releaseTarget
      ? analyzeReleaseTarget(local, remote, args.releaseTarget, { equivalences })
      : analyzeMigrationHistory(local, remote, { equivalences });
    printReport(report);
    if (!args.localOnly) {
      const accepted = args.releaseTarget
        ? report.safeForReleaseTarget
        : args.validateRepairPlan
          ? report.safeAfterReviewedRepairs
          : report.safeForOrderedPush;
      if (!accepted) process.exitCode = 1;
    }
  }).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}

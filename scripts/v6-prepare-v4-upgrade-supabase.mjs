import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(import.meta.dirname, '..');

export const V4_RELEASE_SHA = '95d45c18aed3dbb9862749d73749b571fceaa66e';
export const V4_RELEASE_CUTOFF = '20260913235959';
export const V5_RELEASE_CUTOFF = '20260918235959';

const MIGRATION_FILE = /^(\d{8}|\d{14})_([a-z0-9][a-z0-9_]*)\.sql$/;

export function migrationVersion(filename) {
  const match = MIGRATION_FILE.exec(String(filename || ''));
  if (!match) throw new Error(`Invalid Supabase migration filename: ${filename}`);
  return match[1].length === 8 ? `${match[1]}000000` : match[1];
}

export function migrationLogicalName(filename) {
  const match = MIGRATION_FILE.exec(String(filename || ''));
  if (!match) throw new Error(`Invalid Supabase migration filename: ${filename}`);
  return match[2];
}

export function classifyV4UpgradeMigrations({
  v4MigrationFiles,
  currentMigrationFiles,
  releaseManifest,
  repositoryMapping,
}) {
  if (releaseManifest?.releaseCutoff !== V5_RELEASE_CUTOFF || !Array.isArray(releaseManifest?.migrations)) {
    throw new Error('V5 release migration-order manifest is invalid or has the wrong cutoff.');
  }

  const aliases = repositoryMapping?.aliases ?? {};
  const parityExtras = repositoryMapping?.releasedStateParityExtras ?? {};
  const excluded = repositoryMapping?.excludedFromReleasedV5Baseline ?? {};
  const productionName = (filename) => aliases[filename] ?? migrationLogicalName(filename);

  const releaseRows = releaseManifest.migrations.map((entry) => ({
    version: String(entry.version),
    name: String(entry.name),
  }));
  const releaseByName = new Map(releaseRows.map((entry, index) => [entry.name, { ...entry, index }]));

  const v4Historical = [];
  const v4ParityExtras = [];
  const v4Excluded = [];
  const unmatchedV4 = [];

  for (const filename of [...v4MigrationFiles].sort()) {
    if (Object.prototype.hasOwnProperty.call(parityExtras, filename)) {
      v4ParityExtras.push({ filename, reason: parityExtras[filename] });
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(excluded, filename)) {
      v4Excluded.push({ filename, reason: excluded[filename] });
      continue;
    }
    const name = productionName(filename);
    const release = releaseByName.get(name);
    if (!release || release.version > V4_RELEASE_CUTOFF) {
      unmatchedV4.push(filename);
      continue;
    }
    v4Historical.push({
      filename,
      productionName: name,
      productionVersion: release.version,
      releaseIndex: release.index,
    });
  }

  if (unmatchedV4.length) {
    throw new Error(
      'Pinned V4 migration tree is not fully mapped to released history:\n' +
      unmatchedV4.map((filename) => `- ${filename}`).join('\n'),
    );
  }
  v4Historical.sort((a, b) => a.releaseIndex - b.releaseIndex);
  v4ParityExtras.sort((a, b) => a.filename.localeCompare(b.filename));

  const v5ReleasedRows = releaseRows.filter(
    (entry) => entry.version > V4_RELEASE_CUTOFF && entry.version <= V5_RELEASE_CUTOFF,
  );
  const v5Forward = [];
  for (const filename of [...currentMigrationFiles].sort()) {
    if (Object.prototype.hasOwnProperty.call(parityExtras, filename)) continue;
    if (Object.prototype.hasOwnProperty.call(excluded, filename)) continue;
    const name = productionName(filename);
    const release = releaseByName.get(name);
    if (!release) continue;
    if (release.version > V4_RELEASE_CUTOFF && release.version <= V5_RELEASE_CUTOFF) {
      v5Forward.push({
        filename,
        productionName: name,
        productionVersion: release.version,
        releaseIndex: release.index,
      });
    }
  }
  v5Forward.sort((a, b) => a.releaseIndex - b.releaseIndex);

  const mappedV5Names = new Set(v5Forward.map((entry) => entry.productionName));
  const missingV5ReleaseRows = v5ReleasedRows.filter((entry) => !mappedV5Names.has(entry.name));
  if (missingV5ReleaseRows.length) {
    throw new Error(
      'Released V5 migrations after the V4 cutoff are missing from the repository mapping:\n' +
      missingV5ReleaseRows.map((entry) => `- ${entry.version}_${entry.name}`).join('\n'),
    );
  }

  const v6Forward = [...currentMigrationFiles]
    .filter((filename) => migrationVersion(filename) > V5_RELEASE_CUTOFF)
    .sort();
  const seenV6Versions = new Set();
  for (const filename of v6Forward) {
    if (!/^\d{14}_/.test(filename)) {
      throw new Error(`V6 forward migration must use a unique 14-digit version: ${filename}`);
    }
    const version = migrationVersion(filename);
    if (seenV6Versions.has(version)) throw new Error(`Duplicate V6 migration version: ${version}`);
    seenV6Versions.add(version);
  }

  return Object.freeze({
    v4Historical,
    v4ParityExtras,
    v4Excluded,
    v5Forward,
    v6Forward,
  });
}

function gitText(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitFile(ref, repositoryPath) {
  return gitText(['show', `${ref}:${repositoryPath}`]);
}

function gitFiles(ref, prefix) {
  return gitText(['ls-tree', '-r', '--name-only', ref, '--', prefix])
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function assertPinnedV4Ancestor() {
  const resolved = gitText(['rev-parse', `${V4_RELEASE_SHA}^{commit}`]).trim();
  if (resolved !== V4_RELEASE_SHA) {
    throw new Error(`Pinned V4 release SHA resolved unexpectedly: ${resolved}`);
  }
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', V4_RELEASE_SHA, 'HEAD'], {
    cwd: repoRoot,
    stdio: 'ignore',
  });
  if (ancestry.status !== 0) {
    throw new Error('Pinned V4 release SHA is not an ancestor of the exact V6 candidate.');
  }
}

function writePreparedProject(destination) {
  const sourceSupabase = path.join(repoRoot, 'supabase');
  const sourceMigrations = path.join(sourceSupabase, 'migrations');
  const sourceTests = path.join(sourceSupabase, 'tests');
  const sourceFunctions = path.join(sourceSupabase, 'functions');
  const destinationSupabase = path.join(destination, 'supabase');
  const destinationMigrations = path.join(destinationSupabase, 'migrations');
  const destinationTests = path.join(destinationSupabase, 'tests');
  const destinationFunctions = path.join(destinationSupabase, 'functions');

  const releaseOrderPath = path.join(sourceSupabase, 'v5-release-migration-order.json');
  const repositoryMappingPath = path.join(sourceSupabase, 'v5-release-repository-mapping.json');

  for (const file of [
    path.join(sourceSupabase, 'config.toml'),
    path.join(sourceSupabase, 'seed-v6-ci.sql'),
    releaseOrderPath,
    repositoryMappingPath,
  ]) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing V4->V6 database-CI input: ${path.relative(repoRoot, file)}`);
    }
  }

  assertPinnedV4Ancestor();

  const v4Schema = gitFile(V4_RELEASE_SHA, 'supabase/schema.sql');
  const v4MigrationPaths = gitFiles(V4_RELEASE_SHA, 'supabase/migrations')
    .filter((name) => name.endsWith('.sql'));
  const v4MigrationFiles = v4MigrationPaths.map((name) => path.basename(name));
  const v4PathByFilename = new Map(v4MigrationPaths.map((name) => [path.basename(name), name]));

  const currentMigrationFiles = fs.readdirSync(sourceMigrations, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();

  const releaseManifest = JSON.parse(fs.readFileSync(releaseOrderPath, 'utf8'));
  const repositoryMapping = JSON.parse(fs.readFileSync(repositoryMappingPath, 'utf8'));
  const classified = classifyV4UpgradeMigrations({
    v4MigrationFiles,
    currentMigrationFiles,
    releaseManifest,
    repositoryMapping,
  });

  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destinationMigrations, { recursive: true });
  fs.mkdirSync(destinationTests, { recursive: true });

  fs.copyFileSync(path.join(sourceSupabase, 'config.toml'), path.join(destinationSupabase, 'config.toml'));
  fs.copyFileSync(path.join(sourceSupabase, 'seed-v6-ci.sql'), path.join(destinationSupabase, 'seed.sql'));
  if (fs.existsSync(sourceFunctions)) fs.cpSync(sourceFunctions, destinationFunctions, { recursive: true });

  const baselineName = '00000000000000_biblequest_v4_release_baseline.sql';
  const baselineParts = [
    '-- BibleQuest V4 released database baseline synthesized for disposable V6 upgrade CI.',
    `-- Pinned V4 rollback/source SHA: ${V4_RELEASE_SHA}`,
    '-- Source: exact historical V4 schema snapshot plus historical SQL mapped through the released V5 migration ledger.',
    '-- This baseline exists only to recreate V4 state; the following migration files exercise the actual V5 then V6 forward path.',
    '',
    v4Schema,
  ];

  const adminParity = classified.v4Historical.find((entry) => entry.productionName === 'admin_auth_schema_parity');
  if (adminParity) {
    const historicalPath = v4PathByFilename.get(adminParity.filename);
    baselineParts.push(
      '',
      `-- EARLY V4 PREREQUISITE: ${adminParity.productionVersion}_${adminParity.productionName}`,
      gitFile(V4_RELEASE_SHA, historicalPath),
    );
  }

  for (const entry of classified.v4ParityExtras) {
    const historicalPath = v4PathByFilename.get(entry.filename);
    baselineParts.push(
      '',
      `-- BEGIN V4 RELEASED-STATE PARITY EXTRA: ${entry.filename}`,
      `-- Reason: ${entry.reason}`,
      gitFile(V4_RELEASE_SHA, historicalPath),
      `-- END V4 RELEASED-STATE PARITY EXTRA: ${entry.filename}`,
    );
  }

  for (const entry of classified.v4Historical) {
    if (entry === adminParity) continue;
    const historicalPath = v4PathByFilename.get(entry.filename);
    baselineParts.push(
      '',
      `-- BEGIN V4 RELEASED MIGRATION SQL: ${entry.productionVersion}_${entry.productionName} (repo: ${entry.filename})`,
      gitFile(V4_RELEASE_SHA, historicalPath),
      `-- END V4 RELEASED MIGRATION SQL: ${entry.productionVersion}_${entry.productionName}`,
    );
  }

  fs.writeFileSync(path.join(destinationMigrations, baselineName), baselineParts.join('\n') + '\n');

  const copiedForward = [];
  for (const entry of classified.v5Forward) {
    fs.copyFileSync(path.join(sourceMigrations, entry.filename), path.join(destinationMigrations, entry.filename));
    copiedForward.push(entry.filename);
  }
  for (const filename of classified.v6Forward) {
    fs.copyFileSync(path.join(sourceMigrations, filename), path.join(destinationMigrations, filename));
    copiedForward.push(filename);
  }

  const testFiles = fs.existsSync(sourceTests)
    ? fs.readdirSync(sourceTests, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^v6-.*\.test\.sql$/.test(entry.name))
      .map((entry) => entry.name)
      .sort()
    : [];
  if (!testFiles.length) throw new Error('No V6 Supabase pgTAP tests were found.');
  for (const filename of testFiles) {
    fs.copyFileSync(path.join(sourceTests, filename), path.join(destinationTests, filename));
  }

  const prepared = fs.readdirSync(destinationMigrations).filter((name) => name.endsWith('.sql')).sort();
  if (prepared[0] !== baselineName) throw new Error('V4 release baseline must sort before every forward migration.');
  if (prepared.length !== copiedForward.length + 1) throw new Error('Prepared V4->V6 migration count mismatch.');

  const manifest = {
    format: 1,
    sourceSha: process.env.GITHUB_SHA || process.env.BQ_BUILD_SHA || 'local',
    v4ReleaseSha: V4_RELEASE_SHA,
    v4ReleaseCutoff: V4_RELEASE_CUTOFF,
    v5ReleaseCutoff: V5_RELEASE_CUTOFF,
    syntheticBaseline: baselineName,
    v4HistoricalMigrations: classified.v4Historical,
    v4ReleasedStateParityExtras: classified.v4ParityExtras,
    v4ExcludedRepositorySql: classified.v4Excluded,
    v5ForwardMigrations: classified.v5Forward,
    v6ForwardMigrations: classified.v6Forward,
    tests: testFiles,
    seed: 'supabase/seed-v6-ci.sql',
  };
  fs.writeFileSync(path.join(destination, 'v4-v6-upgrade-ci-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Prepared V4->V6 disposable Supabase project: ${destination}`);
  console.log(`Pinned V4 baseline: ${V4_RELEASE_SHA}`);
  console.log(`V4 historical SQL folded into baseline: ${classified.v4Historical.length}`);
  console.log(`V4 released-state parity extras folded into baseline: ${classified.v4ParityExtras.length}`);
  console.log(`V5 forward migrations after V4 cutoff: ${classified.v5Forward.length}`);
  console.log(`V6 forward migrations: ${classified.v6Forward.length}`);
  console.log(`pgTAP suites: ${testFiles.length}`);
}

const invokedAsCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  const requested = process.argv[2] || process.env.BQ_V4_V6_LOCAL_SUPABASE_ROOT || path.join(repoRoot, '.tmp', 'v4-v6-supabase');
  const destination = path.resolve(requested);
  if (destination === repoRoot || destination === path.parse(destination).root) {
    throw new Error('Refusing to prepare V4->V6 local Supabase at an unsafe destination.');
  }
  writePreparedProject(destination);
}

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const requested = process.argv[2] || process.env.BQ_V6_LOCAL_SUPABASE_ROOT || path.join(repoRoot, '.tmp', 'v6-supabase');
const destination = path.resolve(requested);

if (destination === repoRoot || destination === path.parse(destination).root) {
  throw new Error('Refusing to prepare V6 local Supabase at an unsafe destination.');
}

const sourceSupabase = path.join(repoRoot, 'supabase');
const sourceMigrations = path.join(sourceSupabase, 'migrations');
const destinationSupabase = path.join(destination, 'supabase');
const destinationMigrations = path.join(destinationSupabase, 'migrations');
const destinationTests = path.join(destinationSupabase, 'tests');

const V5_BASELINE_CUTOFF = '20260918235959';

const releaseOrderPath = path.join(sourceSupabase, 'v5-release-migration-order.json');
const repositoryMappingPath = path.join(sourceSupabase, 'v5-release-repository-mapping.json');
const releasePrerequisitesPath = path.join(sourceSupabase, 'v6-ci-release-prerequisites.sql');
const adminAuthParityPath = path.join(sourceMigrations, '20260905_admin_auth_schema_parity.sql');

const required = [
  path.join(sourceSupabase, 'schema.sql'),
  path.join(sourceSupabase, 'config.toml'),
  path.join(sourceSupabase, 'seed-v6-ci.sql'),
  releaseOrderPath,
  repositoryMappingPath,
  releasePrerequisitesPath,
  adminAuthParityPath,
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing V6 database-CI input: ${path.relative(repoRoot, file)}`);
}

function migrationVersion(name) {
  const match = /^(\d{8}|\d{14})_/.exec(name);
  if (!match) throw new Error(`Migration filename lacks an 8- or 14-digit version prefix: ${name}`);
  return match[1].length === 8 ? `${match[1]}000000` : match[1];
}

const migrationFiles = fs
  .readdirSync(sourceMigrations, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => entry.name)
  .sort();

const historicalPreV6Migrations = migrationFiles.filter((name) => migrationVersion(name) <= V5_BASELINE_CUTOFF);
const v6ForwardMigrations = migrationFiles.filter((name) => migrationVersion(name) > V5_BASELINE_CUTOFF);

const releaseOrderManifest = JSON.parse(fs.readFileSync(releaseOrderPath, 'utf8'));
if (releaseOrderManifest?.releaseCutoff !== V5_BASELINE_CUTOFF || !Array.isArray(releaseOrderManifest?.migrations)) {
  throw new Error('V5 release migration-order manifest is invalid or has the wrong cutoff.');
}
const releasedOrder = new Map(
  releaseOrderManifest.migrations.map((entry, index) => [String(entry.name), { index, version: String(entry.version) }]),
);
const repositoryMapping = JSON.parse(fs.readFileSync(repositoryMappingPath, 'utf8'));
const aliases = repositoryMapping?.aliases ?? {};
const releasedStateParityExtras = repositoryMapping?.releasedStateParityExtras ?? {};
const excludedFromReleasedV5Baseline = repositoryMapping?.excludedFromReleasedV5Baseline ?? {};
const migrationLogicalName = (filename) => filename.replace(/^\d{8}(?:\d{6})?_/, '').replace(/\.sql$/, '');
const productionLogicalName = (filename) => aliases[filename] ?? migrationLogicalName(filename);

const orderedHistoricalMigrations = historicalPreV6Migrations.filter(
  (filename) =>
    !Object.prototype.hasOwnProperty.call(releasedStateParityExtras, filename) &&
    !Object.prototype.hasOwnProperty.call(excludedFromReleasedV5Baseline, filename),
);
const parityExtraMigrations = historicalPreV6Migrations.filter(
  (filename) => Object.prototype.hasOwnProperty.call(releasedStateParityExtras, filename),
);
const excludedHistoricalMigrations = historicalPreV6Migrations.filter(
  (filename) => Object.prototype.hasOwnProperty.call(excludedFromReleasedV5Baseline, filename),
);

const unmatchedHistoricalMigrations = orderedHistoricalMigrations.filter(
  (filename) => !releasedOrder.has(productionLogicalName(filename)),
);
if (unmatchedHistoricalMigrations.length) {
  throw new Error(
    'Historical migrations are not mapped to released V5 production history:\n' +
    unmatchedHistoricalMigrations.map((filename) => `- ${filename}`).join('\n'),
  );
}

orderedHistoricalMigrations.sort((a, b) => {
  const ai = releasedOrder.get(productionLogicalName(a)).index;
  const bi = releasedOrder.get(productionLogicalName(b)).index;
  return ai - bi;
});
parityExtraMigrations.sort();

for (const name of v6ForwardMigrations) {
  if (!/^\d{14}_/.test(name)) {
    throw new Error(`V6 forward migrations must use unique 14-digit versions: ${name}`);
  }
}

const seenVersions = new Set();
for (const name of v6ForwardMigrations) {
  const version = migrationVersion(name);
  if (seenVersions.has(version)) throw new Error(`Duplicate V6 migration version: ${version}`);
  seenVersions.add(version);
}

const testFiles = fs.existsSync(path.join(sourceSupabase, 'tests'))
  ? fs
      .readdirSync(path.join(sourceSupabase, 'tests'), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^v6-.*\.test\.sql$/.test(entry.name))
      .map((entry) => entry.name)
      .sort()
  : [];

if (!testFiles.length) throw new Error('No V6 Supabase pgTAP tests were found.');

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destinationMigrations, { recursive: true });
fs.mkdirSync(destinationTests, { recursive: true });

fs.copyFileSync(path.join(sourceSupabase, 'config.toml'), path.join(destinationSupabase, 'config.toml'));
fs.copyFileSync(path.join(sourceSupabase, 'seed-v6-ci.sql'), path.join(destinationSupabase, 'seed.sql'));

const baselineName = '00000000000000_biblequest_v5_release_baseline.sql';
const baselineParts = [
  '-- BibleQuest V5 released database baseline synthesized for disposable V6 CI.',
  '-- Source: checked-in schema snapshot + explicit released-object prerequisites + available historical pre-V6 SQL.',
  '-- This is a disposable V6 contract reconstruction, not a claim that every historical production migration is replayable.',
  '-- Historical files are not renamed or registered individually in migration history.',
  '',
  fs.readFileSync(path.join(sourceSupabase, 'schema.sql'), 'utf8'),
  '',
  '-- BEGIN RELEASED V5 PREREQUISITE PARITY: admin/auth objects',
  fs.readFileSync(adminAuthParityPath, 'utf8'),
  '-- END RELEASED V5 PREREQUISITE PARITY: admin/auth objects',
  '',
  '-- BEGIN RELEASED V5 PREREQUISITE PARITY: CI release overlay',
  fs.readFileSync(releasePrerequisitesPath, 'utf8'),
  '-- END RELEASED V5 PREREQUISITE PARITY: CI release overlay',
];

for (const name of parityExtraMigrations) {
  baselineParts.push(
    '',
    `-- BEGIN RELEASED V5 STATE PARITY PREREQUISITE: ${name}`,
    `-- Reason: ${releasedStateParityExtras[name]}`,
    fs.readFileSync(path.join(sourceMigrations, name), 'utf8'),
    `-- END RELEASED V5 STATE PARITY PREREQUISITE: ${name}`,
  );
}

for (const name of orderedHistoricalMigrations) {
  const productionName = productionLogicalName(name);
  const productionVersion = releasedOrder.get(productionName).version;
  baselineParts.push(
    '',
    `-- BEGIN RELEASED V5 MIGRATION SQL: ${productionVersion}_${productionName} (repo: ${name})`,
    fs.readFileSync(path.join(sourceMigrations, name), 'utf8'),
    `-- END RELEASED V5 MIGRATION SQL: ${productionVersion}_${productionName}`,
  );
}

fs.writeFileSync(
  path.join(destinationMigrations, baselineName),
  baselineParts.join('\n') + '\n',
);

for (const name of v6ForwardMigrations) {
  fs.copyFileSync(path.join(sourceMigrations, name), path.join(destinationMigrations, name));
}
for (const name of testFiles) {
  fs.copyFileSync(path.join(sourceSupabase, 'tests', name), path.join(destinationTests, name));
}

const preparedMigrations = fs.readdirSync(destinationMigrations).filter((name) => name.endsWith('.sql')).sort();
if (preparedMigrations[0] !== baselineName) throw new Error('V5 release baseline must sort before every V6 forward migration.');
if (preparedMigrations.length !== v6ForwardMigrations.length + 1) throw new Error('Prepared V6 migration count mismatch.');

const manifest = Object.freeze({
  format: 2,
  sourceSha: process.env.GITHUB_SHA || process.env.BQ_BUILD_SHA || 'local',
  baseline: 'supabase/schema.sql',
  baselineCutoff: V5_BASELINE_CUTOFF,
  syntheticBaseline: baselineName,
  releaseOrderManifest: 'supabase/v5-release-migration-order.json',
  repositoryMapping: 'supabase/v5-release-repository-mapping.json',
  releasePrerequisites: [
    'supabase/migrations/20260905_admin_auth_schema_parity.sql',
    'supabase/v6-ci-release-prerequisites.sql',
  ],
  historicalPreV6Migrations: orderedHistoricalMigrations.map((filename) => ({
    filename,
    productionName: productionLogicalName(filename),
    productionVersion: releasedOrder.get(productionLogicalName(filename)).version,
  })),
  releasedStateParityExtras: parityExtraMigrations.map((filename) => ({
    filename,
    reason: releasedStateParityExtras[filename],
  })),
  excludedHistoricalMigrations: excludedHistoricalMigrations.map((filename) => ({
    filename,
    reason: excludedFromReleasedV5Baseline[filename],
  })),
  v6ForwardMigrations,
  tests: testFiles,
  seed: 'supabase/seed-v6-ci.sql',
});
fs.writeFileSync(path.join(destination, 'v6-db-ci-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`Prepared isolated V6 Supabase project: ${destination}`);
console.log(`Released V5 baseline + V6 forward migrations: 1 + ${v6ForwardMigrations.length}`);
console.log('Released-object prerequisite parity injected before historical hardening.');
console.log(`Released-history SQL folded into baseline: ${orderedHistoricalMigrations.length}`);
console.log(`Released-state parity prerequisites folded into baseline: ${parityExtraMigrations.length}`);
console.log(`Repository historical SQL excluded from released V5 baseline: ${excludedHistoricalMigrations.length}`);
console.log(`pgTAP suites: ${testFiles.length}`);

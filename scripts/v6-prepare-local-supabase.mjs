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

const required = [
  path.join(sourceSupabase, 'schema.sql'),
  path.join(sourceSupabase, 'config.toml'),
  path.join(sourceSupabase, 'seed-v6-ci.sql'),
  releaseOrderPath,
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
const migrationLogicalName = (filename) => filename.replace(/^\d{8}(?:\d{6})?_/, '').replace(/\.sql$/, '');

for (const filename of historicalPreV6Migrations) {
  const logicalName = migrationLogicalName(filename);
  if (!releasedOrder.has(logicalName)) {
    throw new Error(`Historical migration is not present in released V5 order manifest: ${filename}`);
  }
}

historicalPreV6Migrations.sort((a, b) => {
  const ai = releasedOrder.get(migrationLogicalName(a)).index;
  const bi = releasedOrder.get(migrationLogicalName(b)).index;
  return ai - bi;
});

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
  '-- Source: checked-in schema snapshot + historical pre-V6 SQL in lexical order.',
  '-- Historical files are not renamed or registered individually in migration history.',
  '',
  fs.readFileSync(path.join(sourceSupabase, 'schema.sql'), 'utf8'),
];

for (const name of historicalPreV6Migrations) {
  baselineParts.push(
    '',
    `-- BEGIN HISTORICAL PRE-V6 SQL: ${name}`,
    fs.readFileSync(path.join(sourceMigrations, name), 'utf8'),
    `-- END HISTORICAL PRE-V6 SQL: ${name}`,
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
  historicalPreV6Migrations: historicalPreV6Migrations.map((filename) => ({
    filename,
    productionVersion: releasedOrder.get(migrationLogicalName(filename)).version,
  })),
  v6ForwardMigrations,
  tests: testFiles,
  seed: 'supabase/seed-v6-ci.sql',
});
fs.writeFileSync(path.join(destination, 'v6-db-ci-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`Prepared isolated V6 Supabase project: ${destination}`);
console.log(`Released V5 baseline + V6 forward migrations: 1 + ${v6ForwardMigrations.length}`);
console.log(`Historical pre-V6 SQL folded into one released baseline migration: ${historicalPreV6Migrations.length}`);
console.log(`pgTAP suites: ${testFiles.length}`);

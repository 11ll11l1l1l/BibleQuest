import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  V4_RELEASE_CUTOFF,
  V4_RELEASE_SHA,
  V5_RELEASE_CUTOFF,
  classifyV4UpgradeMigrations,
} from '../../scripts/v6-prepare-v4-upgrade-supabase.mjs';

const read = (filePath) => fs.readFileSync(new URL(`../../${filePath}`, import.meta.url), 'utf8');

test('V4->V6 upgrade fixture is pinned to the preserved V4 rollback ancestor', () => {
  assert.equal(V4_RELEASE_SHA, '95d45c18aed3dbb9862749d73749b571fceaa66e');
  assert.equal(V4_RELEASE_CUTOFF, '20260913235959');
  assert.equal(V5_RELEASE_CUTOFF, '20260918235959');

  const script = read('scripts/v6-prepare-v4-upgrade-supabase.mjs');
  assert.match(script, /merge-base', '--is-ancestor'/);
  assert.match(script, /00000000000000_biblequest_v4_release_baseline\.sql/);
  assert.match(script, /gitFile\(V4_RELEASE_SHA, 'supabase\/schema\.sql'\)/);
  assert.match(script, /v5-release-migration-order\.json/);
  assert.match(script, /v5-release-repository-mapping\.json/);
  assert.match(script, /v6-ci-release-prerequisites\.sql/);
  assert.match(script, /RELEASED V4 PREREQUISITE PARITY/);
  assert.doesNotMatch(script, /supabase link|--linked|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|SERVICE_ROLE_KEY/);
});

test('V4->V6 classifier keeps V4 state in the baseline and applies only post-V4 released V5 plus V6 migrations', () => {
  const releaseManifest = {
    releaseCutoff: V5_RELEASE_CUTOFF,
    migrations: [
      { version: '20260904000742', name: 'biblequest_shared_backend_core' },
      { version: '20260912182043', name: 'poll_aggregates_private_definers' },
      { version: '20260917210238', name: 'push_subscriptions' },
      { version: '20260918043632', name: 'add_media_categories' },
    ],
  };
  const repositoryMapping = {
    aliases: {
      '20260904_shared_backend_rollup.sql': 'biblequest_shared_backend_core',
    },
    releasedStateParityExtras: {
      '20260910_avatar_vault_visibility.sql': 'released V4 state parity',
    },
    excludedFromReleasedV5Baseline: {
      '20260909_encouragement_duplicate_guard.sql': 'not released',
    },
  };

  const result = classifyV4UpgradeMigrations({
    v4MigrationFiles: [
      '20260904_shared_backend_rollup.sql',
      '20260910_avatar_vault_visibility.sql',
      '20260912_poll_aggregates_private_definers.sql',
      '20260909_encouragement_duplicate_guard.sql',
    ],
    currentMigrationFiles: [
      '20260904_shared_backend_rollup.sql',
      '20260910_avatar_vault_visibility.sql',
      '20260912_poll_aggregates_private_definers.sql',
      '20260909_encouragement_duplicate_guard.sql',
      '20260914072000_push_subscriptions.sql',
      '20260917032935_add_media_categories.sql',
      '20260919010101_v6_forward.sql',
    ],
    releaseManifest,
    repositoryMapping,
  });

  assert.deepEqual(
    result.v4Historical.map((entry) => entry.productionName),
    ['biblequest_shared_backend_core', 'poll_aggregates_private_definers'],
  );
  assert.deepEqual(
    result.v4ParityExtras.map((entry) => entry.filename),
    ['20260910_avatar_vault_visibility.sql'],
  );
  assert.deepEqual(
    result.v4Excluded.map((entry) => entry.filename),
    ['20260909_encouragement_duplicate_guard.sql'],
  );
  assert.deepEqual(
    result.v5Forward.map((entry) => entry.productionName),
    ['push_subscriptions', 'add_media_categories'],
  );
  assert.deepEqual(result.v6Forward, ['20260919010101_v6_forward.sql']);
});

test('V4->V6 classifier fails closed when a released post-V4 V5 migration has no repository SQL mapping', () => {
  assert.throws(
    () => classifyV4UpgradeMigrations({
      v4MigrationFiles: ['20260912_poll_aggregates_private_definers.sql'],
      currentMigrationFiles: [
        '20260912_poll_aggregates_private_definers.sql',
        '20260919010101_v6_forward.sql',
      ],
      releaseManifest: {
        releaseCutoff: V5_RELEASE_CUTOFF,
        migrations: [
          { version: '20260912182043', name: 'poll_aggregates_private_definers' },
          { version: '20260917210238', name: 'push_subscriptions' },
        ],
      },
      repositoryMapping: {},
    }),
    /Released V5 migrations after the V4 cutoff are missing/,
  );
});

test('database CI executes the disposable V4->V6 path locally and keeps production credentials out', () => {
  const workflow = read('.github/workflows/v6-database-ci.yml');
  assert.match(workflow, /scripts\/v6-prepare-v4-upgrade-supabase\.mjs/);
  assert.match(workflow, /\/tmp\/bq-v4-v6-db/);
  assert.match(workflow, /Prove V4-to-current V6 replay/);
  assert.match(workflow, /Run V4-upgrade RLS and privilege tests/);
  assert.doesNotMatch(workflow, /supabase link|--linked|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|SERVICE_ROLE_KEY/);
});

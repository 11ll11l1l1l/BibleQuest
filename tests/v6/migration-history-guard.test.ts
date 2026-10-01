import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  analyzeMigrationHistory,
  analyzeReleaseTarget,
  loadRemoteMigrationEvidence,
  normalizeRemoteMigrations,
  parseMigrationFilename,
  readLocalMigrations,
} from '../../scripts/v6-migration-history-guard.mjs';

const local = [
  { version: '20260924010000', name: 'alpha', filename: '20260924010000_alpha.sql' },
  { version: '20260925010000', name: 'beta', filename: '20260925010000_beta.sql' },
  { version: '20260928140000', name: 'assignment_due_reminders', filename: '20260928140000_assignment_due_reminders.sql' },
];

test('migration filenames preserve legacy date-only names and normalize current 14-digit versions', () => {
  assert.deepEqual(parseMigrationFilename('20260928140000_assignment_due_reminders.sql'), {
    version: '20260928140000',
    sourceVersion: '20260928140000',
    name: 'assignment_due_reminders',
    filename: '20260928140000_assignment_due_reminders.sql',
  });
  assert.deepEqual(parseMigrationFilename('20260904_release_hardening.sql'), {
    version: '20260904000000',
    sourceVersion: '20260904',
    name: 'release_hardening',
    filename: '20260904_release_hardening.sql',
  });
  assert.throws(() => parseMigrationFilename('assignment_due_reminders.sql'), /Invalid Supabase migration filename/);
  assert.throws(() => parseMigrationFilename('20260928140000_Assignment.sql'), /Invalid Supabase migration filename/);
});

test('local-only inventory rejects duplicate logical names or versions', () => {
  assert.throws(
    () => analyzeMigrationHistory([...local, { version: '20260929010000', name: 'beta', filename: 'duplicate.sql' }]),
    /repeats name beta/,
  );
  assert.throws(
    () => analyzeMigrationHistory([...local, { version: '20260925010000', name: 'gamma', filename: 'duplicate.sql' }]),
    /repeats version 20260925010000/,
  );
});

test('matching ordered migration history is safe and reports only newer pending migrations', () => {
  const report = analyzeMigrationHistory(local, [
    { version: '20260924010000', name: 'alpha' },
    { version: '20260925010000', name: 'beta' },
  ]);
  assert.equal(report.safeForOrderedPush, true);
  assert.deepEqual(report.pending.map(row => row.name), ['assignment_due_reminders']);
  assert.deepEqual(report.outOfOrderPending, []);
  assert.deepEqual(report.versionMismatches, []);
  assert.deepEqual(report.remoteOnly, []);
});

test('renamed timestamp for the same logical migration fails closed', () => {
  const report = analyzeMigrationHistory(local, [
    { version: '20260923123000', name: 'alpha' },
    { version: '20260925010000', name: 'beta' },
  ]);
  assert.equal(report.safeForOrderedPush, false);
  assert.deepEqual(report.versionMismatches, [{
    name: 'alpha',
    localVersion: '20260924010000',
    remoteVersion: '20260923123000',
  }]);
  assert.match(report.blockers.join(' '), /different versions/);
});

test('older unapplied migrations behind the remote tip fail closed', () => {
  const report = analyzeMigrationHistory(local, [
    { version: '20260925010000', name: 'beta' },
  ]);
  assert.equal(report.safeForOrderedPush, false);
  assert.deepEqual(report.outOfOrderPending.map(row => row.name), ['alpha']);
  assert.match(report.blockers.join(' '), /older local migrations/);
});

test('remote-only migrations and same-version name conflicts fail closed', () => {
  const report = analyzeMigrationHistory(local, [
    { version: '20260924010000', name: 'remote_alpha' },
    { version: '20260925010000', name: 'beta' },
  ]);
  assert.equal(report.safeForOrderedPush, false);
  assert.deepEqual(report.sameVersionDifferentName, [{
    version: '20260924010000',
    localName: 'alpha',
    remoteName: 'remote_alpha',
  }]);
  assert.deepEqual(report.remoteOnly, [{ version: '20260924010000', name: 'remote_alpha' }]);
});

test('remote evidence accepts array/object JSON and rejects malformed records', () => {
  assert.deepEqual(normalizeRemoteMigrations({ migrations: [{ version: '20260924010000', name: 'alpha' }] }), [
    { version: '20260924010000', sourceVersion: '20260924010000', name: 'alpha' },
  ]);
  assert.throws(() => normalizeRemoteMigrations([{ version: 'short', name: 'alpha' }]), /invalid version/);
  assert.throws(() => normalizeRemoteMigrations([{ version: '20260924010000', name: 'Alpha' }]), /invalid name/);
});

test('filesystem readers produce a stable local inventory and parse reviewed remote evidence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bq-migrations-'));
  await writeFile(join(dir, '20260925010000_beta.sql'), '-- beta\n');
  await writeFile(join(dir, '20260904_legacy_alpha.sql'), '-- legacy alpha\n');
  await writeFile(join(dir, '20260924010000_alpha.sql'), '-- alpha\n');
  const remotePath = join(dir, 'remote.json');
  await writeFile(remotePath, JSON.stringify({ migrations: [{ version: '20260924010000', name: 'alpha' }] }));

  const inventory = await readLocalMigrations(dir);
  assert.deepEqual(inventory.map(row => row.name), ['legacy_alpha', 'alpha', 'beta']);
  assert.deepEqual(await loadRemoteMigrationEvidence(remotePath), [{ version: '20260924010000', sourceVersion: '20260924010000', name: 'alpha' }]);
});


test('release target passes when the named migration is safely pending at the ordered tail', () => {
  const report = analyzeReleaseTarget(local, [
    { version: '20260924010000', name: 'alpha' },
    { version: '20260925010000', name: 'beta' },
  ], 'assignment_due_reminders');

  assert.equal(report.safeForReleaseTarget, true);
  assert.deepEqual(report.releaseTarget, {
    name: 'assignment_due_reminders',
    version: '20260928140000',
    status: 'pending',
    appliedExact: false,
    pendingExact: true,
    remoteVersion: null,
  });
});

test('release target passes when the exact migration is already applied', () => {
  const report = analyzeReleaseTarget(local, [
    { version: '20260924010000', name: 'alpha' },
    { version: '20260925010000', name: 'beta' },
    { version: '20260928140000', name: 'assignment_due_reminders' },
  ], 'assignment_due_reminders');

  assert.equal(report.safeForReleaseTarget, true);
  assert.equal(report.releaseTarget.status, 'applied');
  assert.equal(report.releaseTarget.appliedExact, true);
  assert.equal(report.releaseTarget.pendingExact, false);
});

test('release target fails closed when a logical predecessor is recorded under another version', () => {
  const report = analyzeReleaseTarget(local, [
    { version: '20260923123000', name: 'alpha' },
    { version: '20260925010000', name: 'beta' },
  ], 'assignment_due_reminders');

  assert.equal(report.safeForReleaseTarget, false);
  assert.equal(report.releaseTarget.status, 'pending');
  assert.match(report.blockers.join(' '), /different versions/);
});

test('release target fails closed when the target itself has a version mismatch or is absent locally', () => {
  const mismatched = analyzeReleaseTarget(local, [
    { version: '20260924010000', name: 'alpha' },
    { version: '20260925010000', name: 'beta' },
    { version: '20260928135959', name: 'assignment_due_reminders' },
  ], 'assignment_due_reminders');

  assert.equal(mismatched.safeForReleaseTarget, false);
  assert.equal(mismatched.releaseTarget.status, 'blocked');
  assert.equal(mismatched.releaseTarget.remoteVersion, '20260928135959');
  assert.throws(
    () => analyzeReleaseTarget(local, [], 'missing_release_target'),
    /Release target migration is missing/,
  );
});

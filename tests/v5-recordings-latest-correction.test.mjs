import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRecordingsService } from '../src/app/recordings.js';
import { recordingsEn, recordingsTl } from '../src/content/locales/recordings.js';

const uiPath = new URL('../src/features/recordings/index.js', import.meta.url);

test('Recordings UI delegates correction to the existing service owner and not direct backend/storage', async () => {
  const source = await readFile(uiPath, 'utf8');
  assert.match(source, /data-video-feature-toggle/);
  assert.match(source, /data-video-archive/);
  assert.match(source, /recordings\.setFeatured\(id, featured\)/);
  assert.match(source, /recordings\.archive\(id\)/);
  assert.match(source, /server-side RLS/i);
  assert.doesNotMatch(source, /media\.updateVideo|createClient|supabase|localStorage|sessionStorage|fetch\(/i);
});

test('existing Recordings service can update featured curation and archive recordings', async () => {
  const rows = [
    { id: 'old', youtube_id: 'OLDER123456', title: 'Older service', featured: true, active: true, created_at: '2026-09-01T01:00:00Z' },
    { id: 'latest', youtube_id: 'LATEST12345', title: 'Wrong latest service', featured: true, active: true, created_at: '2026-09-08T01:00:00Z' },
    { id: 'ordinary', youtube_id: 'ORDINARY123', title: 'Corrected service', featured: false, active: true, created_at: '2026-09-12T01:00:00Z' }
  ];
  const updates = [];
  const media = {
    async listLiveRecordings() { return rows.filter(row => row.active !== false).map(row => ({ ...row })); },
    async createVideo() { throw new Error('not used'); },
    async updateVideo(id, patch) {
      updates.push({ id, patch: { ...patch } });
      const row = rows.find(item => item.id === id);
      if (!row) throw new Error('missing row');
      Object.assign(row, patch);
      return { ...row };
    }
  };
  const audio = { unload() {}, dispose() {}, mount() {}, play() {}, pause() {}, stop() {}, seek() {}, getState() { return {}; }, getPlayerCount() { return 0; } };
  const session = { isAuthenticated() { return true; }, getState() { return { authenticated: true, user: { id: 'leader-1' } }; } };
  const service = createRecordingsService({ media, audio, session });

  assert.equal((await service.load()).latestService?.id, 'ordinary', 'legacy uncategorized libraries surface the newest recording');
  await service.setFeatured('latest', false);
  assert.equal(service.getLatestService()?.id, 'ordinary', 'changing featured curation must not make Home regress to an older recording');

  await service.setFeatured('ordinary', true);
  assert.equal(service.getLatestService()?.id, 'ordinary', 'featuring the newest recording preserves the latest-service selection');

  await service.archive('ordinary');
  assert.equal(service.getLatestService()?.id, 'latest', 'archiving the newest row reveals the next-newest active legacy recording');
  assert.deepEqual(updates, [
    { id: 'latest', patch: { featured: false } },
    { id: 'ordinary', patch: { featured: true } },
    { id: 'ordinary', patch: { active: false } }
  ]);
});

test('Recordings correction copy keeps EN and TL key parity', () => {
  assert.deepEqual(Object.keys(recordingsEn).sort(), Object.keys(recordingsTl).sort());
  for (const key of [
    'recordings.curator.correctionDescription',
    'recordings.curator.markLatest',
    'recordings.curator.removeLatest',
    'recordings.curator.archive',
    'recordings.corrected',
    'recordings.archived',
    'recordings.correctError'
  ]) {
    assert.ok(recordingsEn[key]?.trim(), `missing EN ${key}`);
    assert.ok(recordingsTl[key]?.trim(), `missing TL ${key}`);
  }
});

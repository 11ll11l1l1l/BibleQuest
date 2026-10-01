import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordingsService } from '../../src/app/recordings.js';

test('video creation uses the active congregation and rejects stale or unauthorized scopes', async () => {
  let userId = 'leader-a';
  let active = { congregationId: 'church-b', userId };
  const created: any[] = [];
  const session = {
    isAuthenticated: () => true,
    getState: () => ({ authenticated: true, user: { id: userId } }),
  };
  const congregation = {
    async load() { return [{ congregationId: 'church-a', userId }, active]; },
    getActive() { return active; },
    can(id: string, capability: string) { return id === active.congregationId && capability === 'ministry'; },
  };
  const media = {
    async listLiveRecordings() { return []; },
    async createVideo(congregationId: string, payload: any) {
      created.push({ congregationId, payload });
      return { ...payload, congregation_id: congregationId };
    },
  };
  const audio = { unload() {}, dispose() {}, getState() { return {}; }, getPlayerCount() { return 0; } };
  const service = createRecordingsService({ media, audio, session, congregation });
  const input = { title: 'Sunday service', youtubeUrl: 'https://youtube.com/watch?v=ABCdef12345' };

  await service.addVideo(input);
  assert.equal(created[0].congregationId, 'church-b');
  assert.equal(created[0].payload.congregation_id, undefined);
  assert.equal(created[0].payload.created_by, 'leader-a');
  await assert.rejects(service.addVideo({ ...input, congregationId: 'church-a' }), /Denied/);
  assert.equal(created.length, 1);

  active = { congregationId: 'church-b', userId: 'another-user' };
  await assert.rejects(service.addVideo(input), /Denied/);
  assert.equal(created.length, 1);
});

test('video updates are scoped to the loaded row congregation and active ministry context', async () => {
  const userId = 'leader-a';
  let active = { congregationId: 'church-b', userId };
  let rows = [{
    id: 'video-b',
    congregation_id: 'church-b',
    youtube_id: 'ABCdef12345',
    title: 'Sunday service',
    description: '',
    featured: false,
    category: 'sunday-service',
    created_at: '2026-10-01T00:00:00Z',
  }];
  const updates: any[] = [];
  const session = {
    isAuthenticated: () => true,
    getState: () => ({ authenticated: true, user: { id: userId } }),
  };
  const congregation = {
    async load() { return [{ congregationId: 'church-a', userId }, { congregationId: 'church-b', userId }]; },
    getActive() { return active; },
    can(id: string, capability: string) { return id === active.congregationId && capability === 'ministry'; },
  };
  const media = {
    async listLiveRecordings() { return rows; },
    async updateVideo(congregationId: string, id: string, patch: any) {
      updates.push({ congregationId, id, patch });
      rows = rows.map(row => row.id === id ? { ...row, ...patch } : row);
      return rows.find(row => row.id === id);
    },
  };
  const audio = { unload() {}, dispose() {}, getState() { return {}; }, getPlayerCount() { return 0; } };
  const service = createRecordingsService({ media, audio, session, congregation });

  await service.load();
  await service.setFeatured('video-b', true);
  assert.deepEqual(updates[0], { congregationId: 'church-b', id: 'video-b', patch: { featured: true } });

  active = { congregationId: 'church-a', userId };
  await assert.rejects(service.archive('video-b'), /Denied/);
  assert.equal(updates.length, 1);
});

test('video mutation result is rejected when active congregation changes in flight', async () => {
  const userId = 'leader-a';
  let active = { congregationId: 'church-b', userId };
  const rows = [{
    id: 'video-b',
    congregation_id: 'church-b',
    youtube_id: 'ABCdef12345',
    title: 'Sunday service',
    featured: false,
    category: 'sunday-service',
    created_at: '2026-10-01T00:00:00Z',
  }];
  const session = {
    isAuthenticated: () => true,
    getState: () => ({ authenticated: true, user: { id: userId } }),
  };
  const congregation = {
    async load() { return [{ congregationId: 'church-a', userId }, { congregationId: 'church-b', userId }]; },
    getActive() { return active; },
    can(id: string, capability: string) { return id === active.congregationId && capability === 'ministry'; },
  };
  const media = {
    async listLiveRecordings() { return rows; },
    async updateVideo(congregationId: string, id: string, patch: any) {
      active = { congregationId: 'church-a', userId };
      return { ...rows[0], ...patch, congregation_id: congregationId, id };
    },
  };
  const audio = { unload() {}, dispose() {}, getState() { return {}; }, getPlayerCount() { return 0; } };
  const service = createRecordingsService({ media, audio, session, congregation });

  await service.load();
  await assert.rejects(service.setFeatured('video-b', true), /Denied/);
});

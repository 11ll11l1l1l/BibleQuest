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
    async load() { return [{ congregationId: 'church-a' }, active]; },
    getActive() { return active; },
    can(id: string, capability: string) { return id === active.congregationId && capability === 'ministry'; },
  };
  const media = {
    async listLiveRecordings() { return []; },
    async createVideo(payload: any) { created.push(payload); return payload; },
  };
  const audio = { unload() {}, dispose() {}, getState() { return {}; }, getPlayerCount() { return 0; } };
  const service = createRecordingsService({ media, audio, session, congregation });
  const input = { title: 'Sunday service', youtubeUrl: 'https://youtube.com/watch?v=ABCdef12345' };

  await service.addVideo(input);
  assert.equal(created[0].congregation_id, 'church-b');
  await assert.rejects(service.addVideo({ ...input, congregationId: 'church-a' }), /Denied/);
  assert.equal(created.length, 1);

  active = { congregationId: 'church-b', userId: 'another-user' };
  await assert.rejects(service.addVideo(input), /Denied/);
  assert.equal(created.length, 1);
});

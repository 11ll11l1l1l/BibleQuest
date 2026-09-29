import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecordingsService } from '../../src/app/recordings.js';
import { recordingsCeb, recordingsEn, recordingsTl } from '../../src/content/locales/recordings.js';
import { formatResumeTime } from '../../src/features/recordings/index.js';

test('Recordings resume time is bounded and formats hours without losing minutes or seconds', () => {
  assert.equal(formatResumeTime(0), '0:00');
  assert.equal(formatResumeTime(754), '12:34');
  assert.equal(formatResumeTime(3661.8), '1:01:01');
  assert.equal(formatResumeTime(-1), '');
  assert.equal(formatResumeTime(Number.NaN), '');
  assert.equal(formatResumeTime(604801), '');
});

test('Recordings service exposes saved resume only for a currently listed item', async () => {
  const cloud = {
    async listLiveRecordings() {
      return [
        { id: 'rec-1', youtube_id: 'abcDEF12345', title: 'Sunday service' },
      ];
    },
  };
  const session = {
    isAuthenticated: () => true,
    getState: () => ({ authenticated: true, user: { id: 'account-a' } }),
  };
  const audio = {
    getState: () => ({ status: 'idle' }),
    getPlayerCount: () => 0,
    getSavedPosition: (sourceId: string) => sourceId === 'abcDEF12345' ? 754 : 0,
    unload() {},
    dispose() {},
    mount() {},
    play() {},
    pause() {},
    stop() {},
    seek() {},
  };
  const service = createRecordingsService({ media: cloud, audio, session });

  await service.load();
  assert.equal(service.getResumePosition('rec-1'), 754);
  assert.equal(service.getResumePosition('missing'), 0);
});

test('Continue-listening label is localized across supported Videos languages', () => {
  for (const dictionary of [recordingsEn, recordingsTl, recordingsCeb]) {
    assert.ok(dictionary['recordings.resumeFrom']);
    assert.match(dictionary['recordings.resumeFrom'], /\{time\}/);
  }
  assert.match(recordingsTl['recordings.resumeFrom'], /\{time\}/);
});

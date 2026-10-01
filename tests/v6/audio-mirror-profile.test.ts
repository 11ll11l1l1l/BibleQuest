import assert from 'node:assert/strict';
import test from 'node:test';

import { validateSpeechAudioProbe, V6_SPEECH_AUDIO_PROFILE } from '../../scripts/v6-audio-mirror-profile.mjs';

test('speech mirror profile accepts efficient spoken-word media characteristics', () => {
  const row = validateSpeechAudioProbe({
    codec: 'mp3',
    bitRate: 96_000,
    sampleRate: 44_100,
    channels: 1,
    durationSeconds: 157.4321,
  });
  assert.equal(row.profileId, 'speech-v1');
  assert.equal(row.codec, 'mp3');
  assert.equal(row.bitRate, 96_000);
  assert.equal(row.sampleRate, 44_100);
  assert.equal(row.channels, 1);
  assert.equal(row.durationSeconds, 157.4321);
});

test('speech mirror profile rejects bloated or non-speech media encodings', () => {
  for (const probe of [
    { codec: 'flac', bitRate: 96_000, sampleRate: 44_100, channels: 1, durationSeconds: 60 },
    { codec: 'mp3', bitRate: V6_SPEECH_AUDIO_PROFILE.maxBitRate + 1, sampleRate: 44_100, channels: 1, durationSeconds: 60 },
    { codec: 'mp3', bitRate: 96_000, sampleRate: 96_000, channels: 1, durationSeconds: 60 },
    { codec: 'mp3', bitRate: 96_000, sampleRate: 44_100, channels: 6, durationSeconds: 60 },
    { codec: 'mp3', bitRate: 96_000, sampleRate: 44_100, channels: 1, durationSeconds: 0 },
  ]) {
    assert.throws(() => validateSpeechAudioProbe(probe), /mirror audio|speech profile/i);
  }
});

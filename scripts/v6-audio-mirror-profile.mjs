import { execFileSync } from 'node:child_process';

export const V6_SPEECH_AUDIO_PROFILE = Object.freeze({
  id: 'speech-v1',
  codecs: Object.freeze(['mp3', 'aac', 'opus', 'vorbis']),
  minBitRate: 24_000,
  maxBitRate: 192_000,
  minSampleRate: 16_000,
  maxSampleRate: 48_000,
  maxChannels: 2,
});

function fail(message) {
  throw new Error(message);
}

export function validateSpeechAudioProbe(probe, profile = V6_SPEECH_AUDIO_PROFILE) {
  if (!probe || typeof probe !== 'object') fail('Audio probe metadata is required for mirror publication.');
  const codec = String(probe.codec ?? '').trim().toLowerCase();
  const bitRate = Number(probe.bitRate);
  const sampleRate = Number(probe.sampleRate);
  const channels = Number(probe.channels);
  const durationSeconds = Number(probe.durationSeconds);

  if (!profile.codecs.includes(codec)) {
    fail('Mirror audio codec must use the reviewed speech profile: ' + profile.codecs.join(', ') + '.');
  }
  if (!Number.isFinite(bitRate) || bitRate < profile.minBitRate || bitRate > profile.maxBitRate) {
    fail('Mirror audio bitrate must be between ' + profile.minBitRate + ' and ' + profile.maxBitRate + ' bps.');
  }
  if (!Number.isSafeInteger(sampleRate) || sampleRate < profile.minSampleRate || sampleRate > profile.maxSampleRate) {
    fail('Mirror audio sample rate must be between ' + profile.minSampleRate + ' and ' + profile.maxSampleRate + ' Hz.');
  }
  if (!Number.isSafeInteger(channels) || channels < 1 || channels > profile.maxChannels) {
    fail('Mirror audio must use one or two channels.');
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    fail('Mirror audio duration must be positive.');
  }

  return Object.freeze({
    profileId: profile.id,
    codec,
    bitRate: Math.round(bitRate),
    sampleRate,
    channels,
    durationSeconds: Number(durationSeconds.toFixed(6)),
  });
}

export function probeSpeechAudioFile(path) {
  let parsed;
  try {
    const raw = execFileSync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=codec_name,sample_rate,channels,bit_rate:format=duration,bit_rate',
      '-of', 'json',
      path,
    ], { encoding: 'utf8' });
    parsed = JSON.parse(raw);
  } catch (error) {
    fail('ffprobe could not inspect mirror audio ' + path + ': '
      + (error instanceof Error ? error.message : String(error)));
  }
  const stream = Array.isArray(parsed?.streams) ? parsed.streams[0] : null;
  const format = parsed?.format ?? {};
  if (!stream) fail('Mirror audio file has no readable audio stream: ' + path + '.');
  return validateSpeechAudioProbe({
    codec: stream.codec_name,
    bitRate: Number(stream.bit_rate || format.bit_rate),
    sampleRate: Number(stream.sample_rate),
    channels: Number(stream.channels),
    durationSeconds: Number(format.duration),
  });
}

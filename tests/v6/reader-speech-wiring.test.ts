import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = relative => readFile(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('Reader exposes browser speech only for text translations without an audio narration provider', async () => {
  const [boot, page, speech, stylesheet] = await Promise.all([
    read('src/app/reader-v6-page.js'),
    read('src/features/reader/index.js'),
    read('src/v6/reader/speech-synthesis.ts'),
    read('src/ui/reader.css'),
  ]);
  assert.match(boot, /import\('\.\.\/v6\/reader\/speech-synthesis\.ts'\)/);
  assert.match(boot, /speechModule\.createReaderSpeechSynthesis/);
  assert.match(page, /\['tl', 'cebocb', 'jko'\]\.includes\(state\.translation\)/);
  assert.match(page, /speech\.loadChapter\(chapter\)/);
  assert.match(page, /data-reader-speech-toggle/);
  assert.match(page, /data-reader-speech-rate/);
  assert.match(page, /speech\.setPlaybackRate\(Number\(target\.value\)\)/);
  assert.match(page, /speech\?\.dispose\?\.\(\)/);
  assert.match(speech, /tl: 'fil-PH'/);
  assert.match(speech, /cebocb: 'ceb-PH'/);
  assert.match(speech, /jko: 'ja-JP'/);
  assert.match(speech, /LANGUAGE_BY_TRANSLATION/);
  assert.match(stylesheet, /\.bq-verse\.is-speech-current/);
});

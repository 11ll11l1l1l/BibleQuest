import assert from 'node:assert/strict';
import test from 'node:test';
import { createReaderSpeechSynthesis } from '../../src/v6/reader/speech-synthesis.ts';
import type { ReaderChapter } from '../../src/v6/reader/contracts.ts';

type FakeUtterance = {
  text: string;
  lang: string;
  rate: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

function fixture(translationId: ReaderChapter['translationId'] = 'tl') {
  const calls: string[] = [];
  const utterances: FakeUtterance[] = [];
  const synthesis = {
    speak(utterance: FakeUtterance) { calls.push(`speak:${utterance.text}`); utterances.push(utterance); },
    pause() { calls.push('pause'); },
    resume() { calls.push('resume'); },
    cancel() { calls.push('cancel'); },
  };
  const speech = createReaderSpeechSynthesis({ synthesis, createUtterance(text) {
    const utterance: FakeUtterance = { text, lang: '', rate: 1, onstart: null, onend: null, onerror: null };
    return utterance;
  } });
  const chapter: ReaderChapter = {
    translationId,
    book: { code: 'JHN', name: 'John', chapters: 21 },
    chapter: 3,
    verses: [
      { chapter: 3, verse: 16, text: 'For God so loved the world.' },
      { chapter: 3, verse: 17, text: 'God sent his Son.' },
    ],
  };
  return { speech, chapter, calls, utterances };
}

test('Reader device speech reads text verses in order with language, rate, pause, resume, and current verse state', () => {
  const h = fixture('tl');
  assert.equal(h.speech.isAvailable(), true);
  h.speech.loadChapter(h.chapter);
  assert.equal(h.speech.getState().status, 'ready');
  h.speech.setPlaybackRate(1.25);
  h.speech.play();
  assert.equal(h.utterances[0]?.lang, 'fil-PH');
  assert.equal(h.utterances[0]?.rate, 1.25);
  h.utterances[0]?.onstart?.();
  assert.equal(h.speech.getState().status, 'speaking');
  assert.equal(h.speech.getState().currentVerse, 16);
  h.speech.pause();
  h.speech.resume();
  assert.deepEqual(h.calls.slice(-2), ['pause', 'resume']);
  h.utterances[0]?.onend?.();
  assert.equal(h.utterances[1]?.text, 'God sent his Son.');
  h.utterances[1]?.onstart?.();
  assert.equal(h.speech.getState().currentVerse, 17);
  h.utterances[1]?.onend?.();
  assert.equal(h.speech.getState().status, 'ended');
  h.speech.play();
  assert.equal(h.utterances[2]?.text, h.chapter.verses[0]?.text);
  h.speech.stop();
  assert.equal(h.speech.getState().status, 'ready');
  assert.equal(h.speech.getState().currentVerse, null);
  h.speech.dispose();
});

test('Reader device speech selects Japanese and Cebuano voice languages and cancels stale chapter speech', () => {
  const h = fixture('jko');
  h.speech.loadChapter(h.chapter);
  h.speech.play();
  assert.equal(h.utterances[0]?.lang, 'ja-JP');
  const stale = h.utterances[0];
  h.speech.loadChapter({ ...h.chapter, translationId: 'cebocb', chapter: 4,
    verses: h.chapter.verses.map(verse => ({ ...verse, chapter: 4 })) });
  assert.equal(h.speech.getState().translationId, 'cebocb');
  assert.equal(h.calls.filter(call => call === 'cancel').length, 2);
  h.speech.play();
  assert.equal(h.utterances[1]?.lang, 'ceb-PH');
  stale?.onend?.();
  assert.equal(h.utterances.length, 2, 'late completion from replaced speech cannot enqueue another verse');
  h.speech.dispose();
});

test('Reader device speech fails closed when unavailable, unsupported for the translation, or given an invalid rate', () => {
  const unavailable = createReaderSpeechSynthesis();
  assert.equal(unavailable.getState().status, 'unavailable');
  assert.throws(() => unavailable.play(), /unavailable/i);

  const h = fixture('bsb');
  assert.throws(() => h.speech.loadChapter(h.chapter), /only for the Tagalog, Cebuano, and Japanese/i);
  assert.throws(() => h.speech.setPlaybackRate(2.1), /rate must be/i);
  h.speech.dispose();
});

test('Reader device speech surfaces browser synthesis errors and can recover on replay', () => {
  const h = fixture();
  h.speech.loadChapter(h.chapter);
  h.speech.play();
  h.utterances[0]?.onerror?.({ error: 'language-unavailable' });
  assert.equal(h.speech.getState().status, 'error');
  assert.equal(h.speech.getState().error, 'language-unavailable');
  h.speech.play();
  assert.equal(h.utterances.length, 2);
  h.speech.dispose();
  assert.equal(h.speech.isAvailable(), false);
  assert.throws(() => h.speech.setPlaybackRate(1), /disposed/i);
});

test('Reader device speech rejects malformed replacement chapters without interrupting current playback', () => {
  const h = fixture();
  h.speech.loadChapter(h.chapter);
  h.speech.play();
  h.utterances[0]?.onstart?.();
  const malformed = { ...h.chapter, chapter: 4 };
  assert.throws(() => h.speech.loadChapter(malformed), /malformed verse/i);
  assert.equal(h.speech.getState().chapter, 3);
  assert.equal(h.speech.getState().status, 'speaking');
  assert.deepEqual(h.calls, ['cancel', 'speak:For God so loved the world.']);
  h.speech.dispose();
});

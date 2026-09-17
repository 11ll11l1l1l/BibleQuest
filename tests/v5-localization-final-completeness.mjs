import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { en, LOCALE_KEY_INVENTORY } from '../src/content/locales/en.js';
import { tl } from '../src/content/locales/tl.js';
import { ceb } from '../src/content/locales/ceb.js';
import {
  recordingsEn,
  recordingsTl,
  recordingsCeb,
  RECORDINGS_LOCALE_KEY_INVENTORY,
} from '../src/content/locales/recordings.js';
import { V5_CLOSEOUT_LOCALE_KEY_INVENTORY, v5CloseoutLocales } from '../src/content/locales/v5-closeout.js';
import { HOME_WEEK_LOCALES, homeThisWeekIntroHtml } from '../src/features/home/today-this-week.js';

const canonicalSource = readFileSync(new URL('../src/content/locales/en.js', import.meta.url), 'utf8');
const tagalogSource = readFileSync(new URL('../src/content/locales/tl.js', import.meta.url), 'utf8');
const cebuanoSource = readFileSync(new URL('../src/content/locales/ceb.js', import.meta.url), 'utf8');
const recordingsSource = readFileSync(new URL('../src/content/locales/recordings.js', import.meta.url), 'utf8');

const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z0-9_.-]+)\}/g)].map(match => match[1]).sort();
const explicitKeys = source => new Set([...source.matchAll(/'([^']+)'\s*:/g)].map(match => match[1]));

const intentionalSharedEnglish = Object.freeze({
  tl: new Set([
    'app.name',
    'locale.tagalog',
    'locale.cebuano',
    'nav.home',
    'nav.media',
    'nav.transformation',
    'myjourney.xp.suffix',
    'shell.account',
    'home.progress.xp',
    'transform.mode.basic',
    'transform.mode.full',
    'transform.basic.eyebrow',
    'assignments.type.quiz',
    'assignments.type.custom',
    'account.settings.pageTitle',
    'account.settings.deviceBrowserFallback',
    'account.settings.devicePlatformFallback',
    'calendar.source.personal',
    'adminConsole.title',
  ]),
  ceb: new Set([
    'app.name',
    'locale.tagalog',
    'locale.cebuano',
    'nav.home',
    'nav.media',
    'nav.transformation',
    'community.action.liveRooms.title',
    'community.action.journeyGroups.title',
    'myjourney.xp.suffix',
    'shell.account',
    'home.progress.xp',
    'transform.mode.basic',
    'transform.mode.full',
    'transform.basic.eyebrow',
    'assignments.type.quiz',
    'account.settings.devicePlatformFallback',
    'calendar.source.personal',
    'adminConsole.title',
  ]),
});

const intentionalRecordingsEnglish = Object.freeze({
  tl: new Set(['recordings.videoFallback', 'recordings.curator.youtubeLink']),
  ceb: new Set(['recordings.videoFallback', 'recordings.curator.youtubeLink']),
});

function assertLocaleComplete(localeName, dictionary, source, allowedEnglish) {
  assert.deepEqual(Object.keys(dictionary).sort(), LOCALE_KEY_INVENTORY, `${localeName} must match the canonical 444-key inventory`);
  const authored = explicitKeys(source);
  for (const key of LOCALE_KEY_INVENTORY) {
    assert.ok(String(dictionary[key] ?? '').trim(), `${localeName} missing/empty key: ${key}`);
    assert.deepEqual(placeholders(dictionary[key]), placeholders(en[key]), `${localeName} placeholder mismatch: ${key}`);
    if (localeName === 'Cebuano' && key === 'app.name') {
      assert.equal(dictionary[key], en[key], 'BibleQuest product name is the sole intentional inherited canonical value');
      continue;
    }
    assert.ok(authored.has(key), `${localeName} key is inherited/fallback instead of explicitly authored: ${key}`);
    if (!allowedEnglish.has(key)) {
      assert.notEqual(dictionary[key], en[key], `${localeName} unexpectedly equals English without an explained exception: ${key}`);
    }
  }
}

function scopedRecordingsSource(marker, nextMarker) {
  const start = recordingsSource.indexOf(marker);
  const end = recordingsSource.indexOf(nextMarker, start + marker.length);
  assert.ok(start >= 0 && end > start, `recordings locale source boundary missing: ${marker}`);
  return recordingsSource.slice(start, end);
}

function assertRecordingsComplete(localeName, dictionary, source, allowedEnglish) {
  assert.deepEqual(Object.keys(dictionary).sort(), RECORDINGS_LOCALE_KEY_INVENTORY, `${localeName} Videos keys must match canonical inventory`);
  const authored = explicitKeys(source);
  for (const key of RECORDINGS_LOCALE_KEY_INVENTORY) {
    assert.ok(authored.has(key), `${localeName} Videos key is inherited/fallback instead of explicitly authored: ${key}`);
    assert.ok(String(dictionary[key] ?? '').trim(), `${localeName} Videos key is empty: ${key}`);
    assert.deepEqual(placeholders(dictionary[key]), placeholders(recordingsEn[key]), `${localeName} Videos placeholder mismatch: ${key}`);
    if (!allowedEnglish.has(key)) {
      assert.notEqual(dictionary[key], recordingsEn[key], `${localeName} Videos unexpectedly equals English without an explained exception: ${key}`);
    }
  }
}

test('Tagalog final agreed surfaces have no unexplained canonical-English fallback', () => {
  assertLocaleComplete('Tagalog', tl, tagalogSource, intentionalSharedEnglish.tl);
});

test('Cebuano final agreed surfaces are explicitly authored rather than inherited from English', () => {
  assertLocaleComplete('Cebuano', ceb, cebuanoSource, intentionalSharedEnglish.ceb);
});

test('Tagalog and Cebuano Videos are complete and explicit', () => {
  const tlSection = scopedRecordingsSource('export const recordingsTl', 'export const recordingsCeb');
  const cebSection = scopedRecordingsSource('export const recordingsCeb', 'export const RECORDINGS_LOCALE_KEY_INVENTORY');
  assertRecordingsComplete('Tagalog', recordingsTl, tlSection, intentionalRecordingsEnglish.tl);
  assertRecordingsComplete('Cebuano', recordingsCeb, cebSection, intentionalRecordingsEnglish.ceb);
});

test('V5 shell recovery copy remains authored in Tagalog and Cebuano', () => {
  for (const key of V5_CLOSEOUT_LOCALE_KEY_INVENTORY) {
    assert.ok(v5CloseoutLocales.tl[key], `missing Tagalog closeout key: ${key}`);
    assert.ok(v5CloseoutLocales.ceb[key], `missing Cebuano closeout key: ${key}`);
    assert.notEqual(v5CloseoutLocales.tl[key], v5CloseoutLocales.en[key], `Tagalog closeout fell back to English: ${key}`);
    assert.notEqual(v5CloseoutLocales.ceb[key], v5CloseoutLocales.en[key], `Cebuano closeout fell back to English: ${key}`);
    assert.deepEqual(placeholders(v5CloseoutLocales.tl[key]), placeholders(v5CloseoutLocales.en[key]), `Tagalog closeout placeholder mismatch: ${key}`);
    assert.deepEqual(placeholders(v5CloseoutLocales.ceb[key]), placeholders(v5CloseoutLocales.en[key]), `Cebuano closeout placeholder mismatch: ${key}`);
  }
});

test('connected weekly journey contains authored Cebuano member content and no canonical English prompt leak', () => {
  assert.ok(HOME_WEEK_LOCALES.includes('ceb'), 'weekly journey must expose Cebuano');
  const html = homeThisWeekIntroHtml('ceb');
  for (const expected of [
    'KARONG SEMANA',
    'Hupti nga magkonektado ang imong semana',
    'HISGOTAN SA PANIHAPON · OPSYONAL',
    'Unsay gipakita sa Dios kanato karong semanaha',
    'Basaha ang Kasulatan',
    'Ablihi ang mga buluhaton',
  ]) assert.ok(html.includes(expected), `weekly journey missing Cebuano authored content: ${expected}`);
  for (const leak of [
    'THIS WEEK',
    'Keep your week connected',
    'ASK AT DINNER · OPTIONAL',
    'What did God show us this week',
    'Read Scripture',
    'Open assignments',
  ]) assert.ok(!html.includes(leak), `weekly journey leaked canonical English content: ${leak}`);
});

test('canonical inventory itself remains stable and source-owned', () => {
  assert.equal(explicitKeys(canonicalSource).size >= LOCALE_KEY_INVENTORY.length, true);
  assert.equal(LOCALE_KEY_INVENTORY.length, 444, 'canonical locale inventory changed; re-review localization acceptance scope');
});

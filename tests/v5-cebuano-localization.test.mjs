import assert from 'node:assert/strict';
import test from 'node:test';
import { en,LOCALE_KEY_INVENTORY } from '../src/content/locales/en.js';
import { ceb } from '../src/content/locales/ceb.js';
import { recordingsEn,recordingsCeb,RECORDINGS_LOCALE_KEY_INVENTORY } from '../src/content/locales/recordings.js';

test('Cebuano shares the canonical UI and Videos key inventories',()=>{
  assert.deepEqual(Object.keys(ceb).sort(),LOCALE_KEY_INVENTORY);
  assert.deepEqual(Object.keys(recordingsCeb).sort(),RECORDINGS_LOCALE_KEY_INVENTORY);
});

test('reviewed high-traffic Cebuano member surfaces do not silently equal English',()=>{
  for(const key of ['locale.label','nav.learn','nav.play','nav.grow','nav.more','shell.brandTagline','community.title','community.action.assignments.title','assignments.eyebrow','assignments.openTask','calendar.intro.heading','myjourney.title','account.settings.pageTitle']){
    assert.notEqual(ceb[key],en[key],`Cebuano still equals English for ${key}`);
  }
  for(const key of ['recordings.pageTitle','recordings.heading','recordings.filter.heading','recordings.empty.heading'])assert.notEqual(recordingsCeb[key],recordingsEn[key],`Cebuano Videos still equals English for ${key}`);
});

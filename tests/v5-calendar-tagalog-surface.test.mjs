import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { en } from '../src/content/locales/en.js';
import { tl } from '../src/content/locales/tl.js';

const source = await readFile(new URL('../src/features/calendar/index.js', import.meta.url), 'utf8');
const calendarKeys = Object.keys(en).filter(key => key.startsWith('calendar.'));
const placeholders = value => [...String(value).matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();

test('Calendar EN/TL dictionaries share every Calendar key and placeholder contract', () => {
  assert.ok(calendarKeys.length >= 45, `expected a bounded Calendar key inventory, found ${calendarKeys.length}`);
  for (const key of calendarKeys) {
    assert.equal(typeof tl[key], 'string', `Tagalog is missing ${key}`);
    assert.ok(tl[key].trim(), `Tagalog value is empty for ${key}`);
    assert.deepEqual(placeholders(tl[key]), placeholders(en[key]), `placeholder mismatch for ${key}`);
  }
});

test('Calendar consumes the single localization owner without translating event/source data', () => {
  assert.match(source, /from '\.\.\/\.\.\/app\/localization\.js'/);
  assert.match(source, /localization\.getLocale\(\)/);
  assert.match(source, /localization\.t\(key,\{locale,values\}\)/);
  assert.match(source, /esc\(event\.title\)/, 'user/source event title must render as data, not dictionary content');
  assert.match(source, /congregation:state\.congregationName/, 'congregation name must remain a runtime value');
  assert.doesNotMatch(source, /const\s+SOURCE_LABEL\s*=/, 'Calendar must not keep a second hard-coded label dictionary');
  assert.doesNotMatch(source, /const\s+WEEKDAYS\s*=/, 'Calendar weekdays must use the canonical locale dictionary');
});

test('migrated Calendar owner contains no representative rendered English chrome literals', () => {
  for (const leak of [
    'Month planner',
    'Previous month',
    'Next month',
    'Calendar categories',
    'SELECTED DAY',
    'No events on this day.',
    'Event title',
    'Event date',
    'Repeat weekly for extra weeks',
    'Save changes',
    'Add event',
    'Next 30 days',
    'Nothing in the next 30 days.',
    'Shared event updated.',
    'Event shared with your congregation.',
    'Could not add that event.'
  ]) {
    assert.equal(source.includes(leak), false, `Calendar source still embeds migrated English UI text: ${leak}`);
  }
});

test('Calendar Tagalog values cover navigation, categories, form, agenda, and status surfaces', () => {
  assert.equal(tl['nav.calendar'], 'Kalendaryo');
  assert.equal(tl['calendar.intro.heading'], 'Buwanang plano');
  assert.equal(tl['calendar.month.today'], 'Ngayon');
  assert.equal(tl['calendar.source.assignment'], 'Gawain');
  assert.equal(tl['calendar.form.addEvent'], 'Magdagdag ng event');
  assert.equal(tl['calendar.agenda.heading'], 'Susunod na 30 araw');
  assert.equal(tl['calendar.status.shared'], 'Naibahagi ang event sa iyong kongregasyon.');
});
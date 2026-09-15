import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const homePath = new URL('../src/features/home/index.js', import.meta.url);
const weekPath = new URL('../src/features/home/today-this-week.js', import.meta.url);

async function sources() {
  const [home, week] = await Promise.all([
    readFile(homePath, 'utf8'),
    readFile(weekPath, 'utf8')
  ]);
  return { home, week };
}

test('Home keeps Daily Journey as the Today anchor', async () => {
  const { home } = await sources();
  assert.match(home, /data-home-daily/);
  assert.match(home, /home\.today\.eyebrow/);
  assert.match(home, /data-open-daily/);
  assert.match(home, /const openDaily = \(\) => onMission\?\.\(\)/);
});

test('Home composes existing congregation and assignment truth under This Week', async () => {
  const { home } = await sources();
  const start = home.indexOf('data-home-this-week');
  const congregation = home.indexOf('data-home-congregation-assignments', start);
  const assignments = home.indexOf('data-home-assignments', congregation);
  assert.ok(start >= 0, 'This Week composition container must exist');
  assert.ok(congregation > start, 'congregation context must remain inside This Week');
  assert.ok(assignments > congregation, 'current assignments must remain inside This Week');
  assert.match(home, /homeAssignmentPanelHtml\(\{status:'loading'\}\)/);
  assert.match(home, /assignments\?\.load/);
});

test('This Week calendar action reuses the existing Home navigation callback', async () => {
  const { home, week } = await sources();
  assert.match(week, /data-open-this-week-calendar/);
  assert.match(week, /home\.shortcut\.calendar/);
  assert.match(home, /weekCalendarButton = root\.querySelector\('\[data-open-this-week-calendar\]'\)/);
  assert.match(home, /const openWeekCalendar = \(\) => onCalendar\?\.\(\)/);
  assert.match(home, /weekCalendarButton\?\.addEventListener\('click', openWeekCalendar\)/);
  assert.match(home, /weekCalendarButton\?\.removeEventListener\('click', openWeekCalendar\)/);
});

test('new This Week copy is bilingual without replacing shared locale dictionaries', async () => {
  const { week } = await sources();
  assert.match(week, /HOME_WEEK_COPY/);
  assert.match(week, /en: Object\.freeze/);
  assert.match(week, /tl: Object\.freeze/);
  assert.match(week, /THIS WEEK/);
  assert.match(week, /NGAYONG LINGGO/);
  assert.match(week, /localization\.t\(key, \{ locale, dictionaries: HOME_WEEK_COPY \}\)/);
  assert.doesNotMatch(week, /fetch\(|localStorage|sessionStorage|createApi|supabase/i);
});

test('composition does not invent unavailable Home datasets', async () => {
  const { home, week } = await sources();
  const combined = `${home}\n${week}`;
  assert.doesNotMatch(combined, /nextEvent|latestService|unreadCount|calendar\.load|recordings\.load|notifications\.load/);
});

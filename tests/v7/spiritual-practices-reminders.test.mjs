import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeReminders } from '../../src/features/spiritual-practices/reminders.js';
function fixture() {
  let owner = 'guest', now = new Date('2026-11-01T00:00:00Z');
  const values = new Map();
  const controls = { master: { checked: true }, categories: [{ id: 'notification-category-reading', checked: true }], quietHours: { enabled: false, start: '22:00', end: '07:00' } };
  const service = createPracticeReminders({ storage: { read: key => values.get(key), write: (key, value) => values.set(key, value) }, getOwner: () => owner, settings: () => controls, clock: () => now, defaultZone: 'Asia/Tokyo' });
  return { service, values, controls, setOwner: value => { owner = value; }, setTime: value => { now = new Date(value); } };
}
const daily = { enabled: true, time: '08:00', timeZone: 'Asia/Tokyo' };
test('daily reminders are off until chosen and dismissal is once per selected-zone day', () => {
  const f = fixture();
  assert.equal(f.service.status().due, false);
  f.service.save(daily);
  assert.equal(f.service.status().due, true);
  f.service.dismiss();
  assert.equal(f.service.status().due, false);
  f.setTime('2026-11-01T23:00:00Z');
  assert.equal(f.service.status().day, '2026-11-02');
  assert.equal(f.service.status().due, true);
});
test('shared master/category switches and quiet hours suppress reminders without dismissing them', () => {
  const f = fixture(); f.service.save(daily);
  f.controls.master.checked = false;
  assert.equal(f.service.status().due, false);
  assert.equal(f.service.status().blockedBySettings, true);
  f.controls.master.checked = true; f.controls.categories[0].checked = false;
  assert.equal(f.service.status().due, false);
  f.controls.categories[0].checked = true; f.controls.quietHours = { enabled: true, start: '08:00', end: '10:00' };
  assert.equal(f.service.status().quietNow, true);
  f.service.dismiss();
  f.setTime('2026-11-01T01:00:00Z');
  assert.equal(f.service.status().due, true);
});
test('overnight quiet hours, date boundaries and all-day quiet are respected', () => {
  const f = fixture(); f.service.save({ ...daily, time: '00:00' });
  f.controls.quietHours.enabled = true;
  f.setTime('2026-11-01T14:00:00Z'); assert.equal(f.service.status().due, false);
  f.setTime('2026-11-01T22:00:00Z'); assert.equal(f.service.status().due, true);
  f.controls.quietHours.start = '07:00'; f.controls.quietHours.end = '07:00';
  assert.equal(f.service.status().due, false);
});
test('account isolation rejects a stale dismissal and never carries the schedule to another owner', () => {
  const f = fixture(); f.service.save(daily);
  const shown = f.service.status();
  f.setOwner('account:alice');
  assert.equal(f.service.status().enabled, false);
  assert.throws(() => f.service.dismiss(shown.owner), /Account changed/);
  f.service.save(daily);
  f.service.dismiss('account:alice');
  f.setOwner('guest'); assert.equal(f.service.status().due, true);
});
test('timezone validation and DST use calendar dates without fixed 24-hour offsets', () => {
  const f = fixture();
  assert.throws(() => f.service.save({ ...daily, time: '25:00' }));
  assert.throws(() => f.service.save({ ...daily, timeZone: 'invalid/zone' }));
  f.service.save({ ...daily, time: '01:00', timeZone: 'America/New_York' });
  f.setTime('2026-11-01T05:30:00Z'); assert.equal(f.service.status().due, true);
  f.service.dismiss();
  f.setTime('2026-11-01T06:30:00Z'); assert.equal(f.service.status().due, false);
  f.setTime('2026-11-02T06:00:00Z'); assert.equal(f.service.status().due, true);
});

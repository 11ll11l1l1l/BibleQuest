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

test('weekly plan evaluates weekdays in the selected time zone and preserves routine/days after dismissal', () => {
  const f=fixture();
  f.service.save({...daily,days:[3,1,5],practiceId:'morning-20'});
  assert.deepEqual(f.service.config().days,[1,3,5]);
  assert.equal(f.service.status().due,false,'Sunday is not scheduled');
  f.setTime('2026-11-01T23:30:00Z');
  assert.equal(f.service.status().day,'2026-11-02');
  assert.equal(f.service.status().due,true,'Monday in Tokyo, despite Sunday UTC');
  f.service.dismiss();
  assert.deepEqual(f.service.config().days,[1,3,5]);assert.equal(f.service.config().practiceId,'morning-20');
  f.setTime('2026-11-03T00:00:00Z');assert.equal(f.service.status().due,false,'Tuesday is not scheduled');
  f.setTime('2026-11-04T00:00:00Z');assert.equal(f.service.status().due,true);
});
test('legacy daily schedules migrate; malformed stored plans disable rather than broaden reminders', () => {
  const f=fixture();
  const key='spiritual-practices.reminders.v1.guest';
  f.values.set(key,{...daily,dismissedDay:''});
  assert.deepEqual(f.service.config().days,[0,1,2,3,4,5,6]);assert.equal(f.service.status().due,true);
  for(const patch of [{days:[]},{days:[1,1]},{days:[8]},{days:['1']},{practiceId:'__proto__'},{practiceId:'silencio-custom'}]){
    f.values.set(key,{...daily,...patch});assert.equal(f.service.status().due,false);
  }
});
test('schedule edits validate before writes and reset dismissal only when the plan changes', () => {
  const f=fixture();const plan={...daily,days:[0,1],practiceId:'evening-5'};
  f.service.save(plan);f.service.dismiss();assert.equal(f.service.status().due,false);
  f.service.save({...plan,days:[1,0]});assert.equal(f.service.status().due,false);
  f.service.save({...plan,practiceId:'morning-15'});assert.equal(f.service.status().due,true);
  const before=structuredClone([...f.values]);
  for(const patch of [{days:[]},{days:[0,0]},{days:[-1]},{practiceId:'<script>'}])assert.throws(()=>f.service.save({...plan,...patch}),/weekday/);
  assert.deepEqual([...f.values],before);
});

test('turning a plan off remains possible after unchecking every weekday',()=>{
  const f=fixture();f.service.save({...daily,days:[1,3],practiceId:'morning-15'});
  f.service.save({...daily,enabled:false,days:[],practiceId:'morning-15'});
  assert.equal(f.service.status().enabled,false);assert.deepEqual(f.service.config().days,[1,3]);
});

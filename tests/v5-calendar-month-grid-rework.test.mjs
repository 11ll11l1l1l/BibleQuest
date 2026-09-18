import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCalendarService } from '../src/app/calendar.js';

function memoryStorage() {
  const data = new Map();
  return {
    read(key, fallback = null) { return data.has(key) ? data.get(key) : fallback; },
    write(key, value) { data.set(key, value); }
  };
}

function fixture() {
  const requestedCongregations = [];
  const memberships = [
    { congregationId: 'cong-first', congregation: { name: 'First Church' }, role: 'member' },
    { congregationId: 'cong-active', congregation: { name: 'Active Church' }, role: 'leader' }
  ];
  const congregation = {
    async load() { return memberships; },
    getActive() { return memberships[1]; },
    can(id, capability) { return id === 'cong-active' && capability === 'ministry'; },
    assert(id, capability) { assert.equal(id, 'cong-active'); assert.equal(capability, 'ministry'); }
  };
  const api = {
    calendar: {
      async list() { return []; },
      async listCongregation(id) {
        requestedCongregations.push(id);
        return [
          { id: 'nov-service', user_id: 'leader-1', event_date: '2026-11-20', title: 'Church service', notes: '', all_day: true, recurrence_weeks: 0 },
          { id: 'nov-study', user_id: 'leader-1', event_date: '2026-11-06', title: 'Weekly study', notes: '', all_day: true, recurrence_weeks: 4 }
        ];
      }
    }
  };
  const service = createCalendarService({
    session: { getState: () => ({ authenticated: true, user: { id: 'leader-1' } }) },
    privateStorage: memoryStorage(), api,
    assignments: { snapshot: () => ({ assignments: [] }) }, congregation,
    clock: () => new Date('2026-09-14T00:00:00Z')
  });
  return { service, requestedCongregations };
}

test('Calendar consumes the Phase 6 active congregation rather than memberships[0]', async () => {
  const { service, requestedCongregations } = fixture();
  const state = await service.load();
  assert.deepEqual(requestedCongregations, ['cong-active']);
  assert.equal(state.congregationId, 'cong-active');
  assert.equal(state.congregationName, 'Active Church');
  assert.equal(state.canShareWithCongregation, true);
});

test('Calendar ranged agenda reaches a later visible 6-week month beyond the old 30-day horizon', async () => {
  const { service } = fixture();
  const state = await service.load();
  assert.equal(state.agenda.some(day => day.date === '2026-11-20'), false, 'default 30-day agenda must not falsely prove a later month');
  const agenda = service.getAgenda({ startDate: new Date('2026-11-01T00:00:00Z'), days: 42 });
  assert.ok(agenda.find(day => day.date === '2026-11-20')?.events.some(event => event.title === 'Church service' && event.source === 'congregation'));
  assert.ok(agenda.find(day => day.date === '2026-12-04')?.events.some(event => event.title === 'Weekly study' && event.source === 'congregation'));
});

test('Calendar month-grid UI exposes navigation, day interaction, explicit categories and 42-day requests', () => {
  const source = fs.readFileSync(new URL('../src/features/calendar/index.js', import.meta.url), 'utf8');
  assert.match(source, /data-calendar-month-prev/);
  assert.match(source, /data-calendar-month-next/);
  assert.match(source, /data-calendar-today/);
  assert.match(source, /data-calendar-day=/);
  assert.match(source, /days:42/);
  assert.match(source, /role="grid"/);
  assert.match(source, /calendar\.source\.assignment/);
  assert.match(source, /calendar\.source\.congregation/);
  assert.match(source, /calendar\.source\.personal/);
  assert.match(source, /aria-pressed=/);
});

test('Calendar mobile CSS keeps interactive month controls at touch-safe heights and seven columns', () => {
  const css = fs.readFileSync(new URL('../src/ui/calendar.css', import.meta.url), 'utf8');
  assert.match(css, /grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(css, /min-height:58px/);
  assert.match(css, /min-width:44px;min-height:44px/);
});

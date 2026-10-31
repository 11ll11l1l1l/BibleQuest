import { getPractice } from './content.js';
const terminal = state => ['completed', 'ended'].includes(state);
export function createSession(templateId, now = Date.now(), id = globalThis.crypto.randomUUID(), durationMinutes = null) {
  const practice = getPractice(templateId, durationMinutes);
  if (!practice) throw new Error('Unknown practice.');
  return { version: 1, id, templateId, templateVersion: practice.version, ...(templateId === 'silencio-custom' ? { durationMinutes } : {}), state: 'running', stage: 0, remaining: practice.stages[0].seconds * 1000, deadline: now + practice.stages[0].seconds * 1000, elapsed: 0, updatedAt: now, skipped: [] };
}
export function validSession(value) {
  const practice = getPractice(value?.templateId, value?.durationMinutes);
  return Boolean(practice && value.version === 1 && value.templateVersion === practice.version && typeof value.id === 'string' && value.id.length > 0 && value.id.length < 200 && ['running', 'paused', 'completed', 'ended'].includes(value.state) && Number.isInteger(value.stage) && value.stage >= 0 && value.stage < practice.stages.length && ['remaining', 'deadline', 'elapsed', 'updatedAt'].every(key => Number.isFinite(value[key]) && value[key] >= 0) && value.remaining <= practice.stages[value.stage].seconds * 1000 && value.elapsed <= practice.stages.reduce((sum, row) => sum + row.seconds * 1000, 0) && Array.isArray(value.skipped) && value.skipped.every(index => Number.isInteger(index) && index >= 0 && index < value.stage));
}
export function advance(session, action = 'tick', now = Date.now()) {
  if (!validSession(session) || !Number.isFinite(now) || now < 0) throw new Error('Invalid practice session.');
  let next = { ...session, skipped: [...session.skipped] };
  if (terminal(next.state)) return next;
  const practice = getPractice(next.templateId, next.durationMinutes);
  now = Math.max(now, next.updatedAt);
  if (next.state === 'running') {
    let delta = now - next.updatedAt;
    while (delta >= next.remaining) {
      delta -= next.remaining;
      next.elapsed += next.remaining;
      if (next.stage === practice.stages.length - 1) {
        next.state = 'completed'; next.remaining = 0; break;
      }
      next.stage += 1;
      next.remaining = practice.stages[next.stage].seconds * 1000;
    }
    if (next.state === 'running') { next.elapsed += delta; next.remaining -= delta; }
  }
  next.updatedAt = now;
  if (!terminal(next.state)) {
    if (action === 'pause') next.state = 'paused';
    if (action === 'resume') next.state = 'running';
    if (action === 'end') next.state = 'ended';
    if (action === 'skip') {
      // A skip never counts unpracticed time or produces a completed session.
      if (next.stage === practice.stages.length - 1) next.state = 'ended';
      else { next.skipped.push(next.stage); next.stage += 1; next.remaining = practice.stages[next.stage].seconds * 1000; }
    }
  }
  next.deadline = next.state === 'running' ? now + next.remaining : 0;
  return next;
}

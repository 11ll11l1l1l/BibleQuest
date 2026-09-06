import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const definition = { id: 'browser.lesson', version: 1, title: 'Browser Lesson', steps: [{ id: 'intro', type: 'content', prompt: 'Read.' }, { id: 'choice', type: 'choice', prompt: 'Choose.', choices: ['No', 'Yes'], answer: 1, feedback: { correct: 'Yes' } }, { id: 'reflect', type: 'text', prompt: 'Reflect.', maxLength: 120 }] };

async function evaluate(page, action) {
  return page.evaluate(async ({ definition, action }) => {
    const [{ createLessonEngine }, { storage }] = await Promise.all([import('/src/engines/lesson.js'), import('/src/core/storage.js')]);
    const engine = createLessonEngine({ storage, clock: () => new Date('2026-09-06T12:00:00+09:00') });
    const opened = engine.open(definition);
    if (action === 'start') {
      engine.advance();
      const answer = engine.respond(1);
      return { resumed: opened.resumed, state: answer.state };
    }
    if (action === 'resume-complete') {
      const before = engine.getState();
      engine.advance();
      engine.respond('A browser-persisted reflection.');
      const done = engine.advance();
      return { before, done };
    }
    if (action === 'reopen-restart') {
      const before = engine.getState();
      const restarted = engine.restart();
      return { before, restarted: restarted.state };
    }
    return { state: engine.getState() };
  }, { definition, action });
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { const { storage } = await import('/src/core/storage.js'); storage.remove('lesson-sessions'); });
  const start = await evaluate(page, 'start');
  assert(!start.resumed && start.state.index === 1 && start.state.responses.choice === 1, 'Browser lesson did not persist first interactive response.');
  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.locator('[data-bq-shell="v3"]').count() === 1, 'Lesson reload duplicated the application shell.');
  const completed = await evaluate(page, 'resume-complete');
  assert(completed.before.index === 1 && completed.before.responses.choice === 1, 'Browser lesson did not resume after reload.');
  assert(completed.done.completed && completed.done.state.status === 'complete' && completed.done.state.responses.reflect.includes('browser-persisted'), 'Browser lesson did not complete after resumed response.');
  await page.reload({ waitUntil: 'networkidle' });
  const reopened = await evaluate(page, 'reopen-restart');
  assert(reopened.before.status === 'complete', 'Completed lesson did not survive browser reload.');
  assert(reopened.restarted.status === 'active' && reopened.restarted.index === 0 && Object.keys(reopened.restarted.responses).length === 0, 'Browser lesson restart did not clear lifecycle state.');
  await page.close();
  console.log('BibleQuest v3 lesson engine browser regression passed.');
} finally { await browser.close(); }

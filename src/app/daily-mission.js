import { buildDailyMissionDefinition, selectDailyPassage } from '../features/daily-mission/content.js';

const STEP_XP = Object.freeze({ retrieve:12, context:8, learn:8, apply:8, reflect:8 });
const COMPLETE_XP = 25;

export function createDailyMissionService({ lesson, progress, reader, clock = () => new Date() }) {
  if (!lesson || !progress || !reader) throw new Error('Daily Mission requires lesson, progress, and reader owners.');
  let activeDate = null;
  let activePassage = null;

  const dateKey = () => progress.getDateKey(clock());
  const requireOpen = () => {
    if (!activeDate || !activePassage) throw new Error('Open the Daily Journey before using it.');
  };
  const decorate = state => {
    requireOpen();
    const completedSteps = Object.keys(state.responses || {}).length;
    return Object.freeze({ dateKey:activeDate, passage:activePassage, completedSteps, percent:Math.round((completedSteps / state.totalSteps) * 100), state });
  };
  const reconcile = state => {
    requireOpen();
    for (const stepId of Object.keys(state.responses || {})) {
      const xp = STEP_XP[stepId];
      if (xp == null) continue;
      progress.record({ id:`daily:${activeDate}:step:${stepId}`, type:'daily.step', xp, meaningful:true });
    }
    if (state.status === 'complete') progress.record({ id:`daily:${activeDate}:complete`, type:'daily.complete', xp:COMPLETE_XP, meaningful:false });
    return state;
  };

  function today() {
    const key = dateKey();
    return Object.freeze({ dateKey:key, passage:selectDailyPassage(key) });
  }

  function open() {
    const key = dateKey();
    activeDate = key;
    activePassage = selectDailyPassage(key);
    const opened = lesson.open(buildDailyMissionDefinition(key));
    reconcile(opened.state);
    return Object.freeze({ resumed:opened.resumed, ...decorate(opened.state) });
  }

  function getState() {
    return decorate(lesson.getState());
  }

  function respond(value) {
    requireOpen();
    const result = lesson.respond(value);
    reconcile(result.state);
    return Object.freeze({ applied:result.applied, duplicate:result.duplicate, feedback:result.feedback, ...decorate(result.state) });
  }

  function advance() {
    requireOpen();
    const result = lesson.advance();
    reconcile(result.state);
    return Object.freeze({ completed:result.completed, duplicate:result.duplicate, completion:result.completion || null, ...decorate(result.state) });
  }

  function prepareReader() {
    requireOpen();
    reader.setBook(activePassage.code, activePassage.chapter);
    return Object.freeze({ code:activePassage.code, chapter:activePassage.chapter, from:activePassage.from, to:activePassage.to });
  }

  function close() {
    lesson.close();
    activeDate = null;
    activePassage = null;
  }

  return Object.freeze({ today, open, getState, respond, advance, prepareReader, close, stepXp:STEP_XP, completionXp:COMPLETE_XP });
}

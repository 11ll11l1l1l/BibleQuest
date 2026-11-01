// Read-only practice timer projection. The canonical timer owns all state and
// never counts skipped intervals as elapsed practice.
export function remainingPracticeMs(session, practice) {
  if (!session || !practice || !Array.isArray(practice.stages)
      || !Number.isInteger(session.stage) || session.stage < 0
      || session.stage >= practice.stages.length) return 0;
  if (!['running', 'paused'].includes(session.state)) return 0;
  const remaining = Number(session.remaining);
  if (!Number.isFinite(remaining) || remaining < 0) return 0;
  return Math.max(0, remaining + practice.stages.slice(session.stage + 1)
    .reduce((sum, item) => sum + item.seconds * 1000, 0));
}

export function nextPracticeStage(session, practice) {
  if (!session || !practice || !Array.isArray(practice.stages)
      || !Number.isInteger(session.stage) || !['running', 'paused'].includes(session.state)) return null;
  const stage = practice.stages[session.stage + 1];
  return stage && typeof stage.title === 'string' && typeof stage.guide === 'string'
    && Number.isFinite(stage.seconds) && stage.seconds > 0 ? stage : null;
}

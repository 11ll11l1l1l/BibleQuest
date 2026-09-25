import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const routeSource=await readFile(new URL('../../src/features/games/index.js',import.meta.url),'utf8');

test('Games route delegates presentation to bounded view modules',()=>{
  for(const view of [
    './views/launcher-memory.js',
    './views/same-room.js',
    './views/challenges.js',
    './views/recall.js',
    './views/solo.js',
    './views/status.js',
  ]) assert.ok(routeSource.includes(view),`missing Games view delegation: ${view}`);

  for(const renderer of [
    'renderLauncherView',
    'renderMemoryView',
    'renderMemoryCompleteView',
    'renderSameRoomSetupView',
    'renderSameRoomQuestionView',
    'renderSameRoomCompleteView',
    'renderDetectiveView',
    'renderTimelineView',
    'renderRecallLibraryView',
    'renderRecallQuestionView',
    'renderRecallCompleteView',
    'renderSoloQuestionView',
    'renderSoloCompleteView',
    'renderGamesLoadingView',
    'renderGamesErrorView',
  ]) assert.ok(routeSource.includes(renderer),`missing Games renderer delegation: ${renderer}`);
});

test('Games route owner does not reintroduce presentation markup',()=>{
  assert.doesNotMatch(routeSource,/class="bq-/);
  assert.doesNotMatch(routeSource,/<h[1-6]\b/i);
  assert.doesNotMatch(routeSource,/<button\b/i);
  assert.match(routeSource,/html:'<section data-games-page><\/section>'/);
});

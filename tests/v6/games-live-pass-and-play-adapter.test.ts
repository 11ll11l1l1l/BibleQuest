import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../src/app/games.js', import.meta.url), 'utf8');

function functionSlice(startMarker:string,endMarker:string){
  const start=source.indexOf(startMarker);
  const end=source.indexOf(endMarker,start);
  assert.notEqual(start,-1,`missing source marker: ${startMarker}`);
  assert.notEqual(end,-1,`missing source marker: ${endMarker}`);
  return source.slice(start,end);
}

test('live Play Together delegates session and turn logic to the V6 adapter boundary', () => {
  for (const symbol of [
    'startLegacyPassAndPlaySession',
    'answerLegacyPassAndPlaySession',
    'advanceLegacyPassAndPlaySession',
    'finishLegacyPassAndPlaySession',
    'adaptLegacyQuestions',
  ]) assert.ok(source.includes(symbol), `missing live V6 pass-and-play delegation: ${symbol}`);

  assert.match(source, /moderation\?\[\.\.\.moderation\.applyCore\(base\)\]:base/);
  assert.match(source, /startLegacyPassAndPlaySession\(validSameRoomId\(\),count,adaptLegacyQuestions\(bank\)\)/);
});

test('live Play Together no longer owns answer locking, scoring or turn-rotation mutations', () => {
  const answerSource=functionSlice('function answerSameRoom','function nextSameRoom');
  const nextSource=functionSlice('function nextSameRoom','function finishSameRoom');
  const finishSource=functionSlice('function finishSameRoom','function resetSameRoom');

  assert.doesNotMatch(source, /sameRoom\.players\.map/);
  assert.doesNotMatch(source, /score:player\.score\+/);
  assert.doesNotMatch(source, /currentPlayerIndex:\(sameRoom\.currentPlayerIndex\+1\)/);
  assert.doesNotMatch(answerSource, /sameRoom\.session\.locked/);
  assert.doesNotMatch(answerSource, /choice<0\|\|choice>=question\.choices\.length/);
  assert.doesNotMatch(nextSource, /sameRoom\.session\.locked/);

  assert.match(answerSource,/answerLegacyPassAndPlaySession/);
  assert.match(nextSource,/advanceLegacyPassAndPlaySession/);
  assert.match(finishSource,/finishLegacyPassAndPlaySession/);
  assert.match(finishSource,/phase:'same-room-complete',session:transition\.state\.session,turns:transition\.state\.turns/);
});

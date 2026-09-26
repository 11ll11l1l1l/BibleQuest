import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../src/app/games.js', import.meta.url), 'utf8');

test('live Play Together delegates session and turn logic to the V6 adapter boundary', () => {
  for (const symbol of [
    'startLegacyPassAndPlaySession',
    'answerLegacyPassAndPlaySession',
    'advanceLegacyPassAndPlaySession',
    'adaptLegacyQuestions',
  ]) assert.ok(source.includes(symbol), `missing live V6 pass-and-play delegation: ${symbol}`);

  assert.match(source, /moderation\?\[\.\.\.moderation\.applyCore\(base\)\]:base/);
  assert.match(source, /startLegacyPassAndPlaySession\(validSameRoomId\(\),count,adaptLegacyQuestions\(bank\)\)/);
});

test('live Play Together no longer owns answer locking, scoring or turn-rotation mutations', () => {
  assert.doesNotMatch(source, /sameRoom\.players\.map/);
  assert.doesNotMatch(source, /score:player\.score\+/);
  assert.doesNotMatch(source, /currentPlayerIndex:\(sameRoom\.currentPlayerIndex\+1\)/);
  assert.doesNotMatch(source, /if\(sameRoom\.session\.locked\)/);
  assert.doesNotMatch(source, /choice<0\|\|choice>=question\.choices\.length/);
});

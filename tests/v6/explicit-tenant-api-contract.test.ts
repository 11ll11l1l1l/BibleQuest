import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiSource = await readFile(new URL('../../src/core/api.js', import.meta.url), 'utf8');

function methodSource(owner: string, method: string) {
  const ownerMatch = new RegExp(`const\\s+${owner}\\s*=\\s*Object\\.freeze\\(\\{`).exec(apiSource);
  const ownerStart = ownerMatch?.index ?? -1;
  assert.notEqual(ownerStart, -1, `Missing API owner ${owner}.`);
  const ownerEnd = apiSource.indexOf('\n  });', ownerStart);
  assert.notEqual(ownerEnd, -1, `Could not find end of API owner ${owner}.`);
  const ownerSource = apiSource.slice(ownerStart, ownerEnd);
  const methodStart = ownerSource.indexOf(`async ${method}(`);
  assert.notEqual(methodStart, -1, `Missing ${owner}.${method}().`);
  const nextMethod = ownerSource.indexOf('\n    async ', methodStart);
  return ownerSource.slice(methodStart, nextMethod < 0 ? undefined : nextMethod);
}

test('private assignment response repository accepts the congregation as an explicit scope', () => {
  const source = methodSource('assignments', 'loadPrivateResponses');
  assert.match(source, /^async loadPrivateResponses\(congregationId,assignmentId\)/);
});

test('private assignment response query filters through the linked assignment congregation', () => {
  const source = methodSource('assignments', 'loadPrivateResponses');
  assert.match(source, /bible_assignments!inner\(\)/);
  assert.match(source, /\.eq\('bible_assignments\.congregation_id',congregationId\)/);
});


test('avatar membership writes accept the congregation as an explicit scope', () => {
  const source = methodSource('avatarVault', 'save');
  assert.match(source, /^async save\(userId,congregationId,selectedStyle\)/);
});

test('avatar membership writes require and filter an explicit congregation scope', () => {
  const source = methodSource('avatarVault', 'save');
  assert.match(source, /\.eq\('user_id',userId\)\.eq\('congregation_id',congregationId\)/);
  assert.match(source, /if\(!congregationId\)throw Error\(\)/);
});


test('content review decision writes accept the congregation as an explicit scope', () => {
  const source = methodSource('contentReview', 'saveDecision');
  assert.match(source, /^async saveDecision\(congregationId,row\)/);
});

test('content review decision writes override payload tenant from the explicit scope', () => {
  const source = methodSource('contentReview', 'saveDecision');
  assert.match(source, /upsert\(\{\.\.\.row,congregation_id:congregationId\}/);
});

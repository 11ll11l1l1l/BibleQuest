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


test('Live Rooms repository requires explicit congregation scope for tenant-sensitive operations', () => {
  const expectations = [
    ['findByCode', /^async findByCode\(roomCode,congregationId\)/, /\.eq\('congregation_id',tenantId\)/],
    ['loadRoom', /^async loadRoom\(roomId,congregationId\)/, /\.eq\('congregation_id',tenantId\)/],
    ['joinParticipant', /^async joinParticipant\(roomId,userId,congregationId\)/, /\.eq\('congregation_id',tenantId\)/],
    ['participants', /^async participants\(roomId,congregationId\)/, /\.eq\('congregation_id',tenantId\)/],
    ['endRoom', /^async endRoom\(roomId,userId,congregationId\)/, /\.eq\('congregation_id',tenantId\)/],
    ['subscribe', /^async subscribe\(roomId,congregationId,listener\)/, /congregation_id.*tenantId/],
  ] as const;

  for (const [method, signature, scope] of expectations) {
    const source = methodSource('liveRooms', method);
    assert.match(source, signature);
    assert.match(source, scope);
  }
});

test('media mutation repository requires explicit congregation scope', () => {
  const listSource = methodSource('media', 'listLiveRecordings');
  assert.match(listSource, /^async listLiveRecordings\(congregationId\)/);
  assert.match(listSource, /\.eq\('congregation_id', tenantId\)/);
  assert.match(listSource, /if \(!tenantId\) throw Error\(\)/);

  const createSource = methodSource('media', 'createVideo');
  assert.match(createSource, /^async createVideo\(congregationId, payload\)/);
  assert.match(createSource, /congregation_id: tenantId/);
  assert.match(createSource, /if \(!tenantId\) throw Error\(\)/);

  const updateSource = methodSource('media', 'updateVideo');
  assert.match(updateSource, /^async updateVideo\(congregationId, id, patch\)/);
  assert.match(updateSource, /\.eq\('congregation_id', tenantId\)\.eq\('id', id\)/);
  assert.match(updateSource, /if \(!tenantId\) throw Error\(\)/);
});


test('remaining sensitive creation/write repositories require explicit congregation scope', () => {
  const journeyCreate = methodSource('journeyGroups', 'create');
  assert.match(journeyCreate, /^async create\(congregationId,payload\)/);
  assert.match(journeyCreate, /\.\.\.payload,congregation_id:tenantId/);
  assert.match(journeyCreate, /if\(!tenantId\)throw Error\(\)/);

  const liveCreate = methodSource('liveRooms', 'create');
  assert.match(liveCreate, /^async create\(congregationId,row\)/);
  assert.match(liveCreate, /insert\(\{\.\.\.row,congregation_id:tenantId\}\)/);

  const award = methodSource('congregationRecognition', 'award');
  assert.match(award, /^async award\(congregationId,row\)/);
  assert.match(award, /insert\(\{\.\.\.row,congregation_id:tenantId\}\)/);

  const report = methodSource('contentReports', 'submit');
  assert.match(report, /^async submit\(congregationId,row\)/);
  assert.match(report, /insert\(\{\.\.\.row,congregation_id:tenantId\}\)/);

  const decision = methodSource('contentReview', 'saveDecision');
  assert.match(decision, /^async saveDecision\(congregationId,row\)/);
  assert.match(decision, /upsert\(\{\.\.\.row,congregation_id:tenantId\}/);
});

test('systemic sensitive repository inventory exposes congregation context explicitly', () => {
  const inventory = {
    congregation: ['updateSettings','listManagedMembers','manageMember'],
    presence: ['list','touch','leave','activeCount'],
    teamCenter: ['list','create','add','remove','rename','archive'],
    scoreEvents: ['submit'],
    leaderboards: ['load'],
    avatarVault: ['save'],
    congregationRecognition: ['load','award'],
    assignments: ['load','loadResponsePresence','loadPrivateResponses','targets','lifecycle','create','start','complete','subscribe'],
    ministryAnnouncements: ['list','publish'],
    journeyGroups: ['list','create','join','rotateCode','leave'],
    liveRooms: ['create','findByCode','loadRoom','joinParticipant','participants','endRoom','subscribe'],
    encouragements: ['list','send'],
    contentDecisions: ['list'],
    contentReports: ['submit'],
    contentReview: ['loadQueue','saveDecision','markReportsReviewed'],
    media: ['listLiveRecordings','createVideo','updateVideo'],
    calendar: ['listCongregation','createCongregation','updateCongregation','removeCongregation'],
  } as const;

  for (const [owner, methods] of Object.entries(inventory)) {
    for (const method of methods) {
      const source = methodSource(owner, method);
      assert.match(
        source,
        new RegExp(`^async ${method}\\([^)]*congregationId`),
        `${owner}.${method}() must receive congregationId explicitly`,
      );
    }
  }
});


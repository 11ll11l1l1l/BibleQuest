import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBsbAlignmentShardPlan,
  findMissingBsbAlignmentOutputs,
} from '../../scripts/v6-plan-bsb-alignment-shards.mjs';

function fakePlan() {
  const expectedOutputFiles = [];
  const books = [
    ['PSA', 150], ['ISA', 66], ['GEN', 50], ['MAT', 28], ['JHN', 21],
    ['REV', 22], ['ROM', 16], ['JON', 4],
  ];
  for (const [book, chapters] of books) {
    for (let chapter = 1; chapter <= chapters; chapter += 1) {
      expectedOutputFiles.push(book + '/' + book + '_' + String(chapter).padStart(3, '0') + '_words.json');
    }
  }
  let fillerChapter = 1;
  while (expectedOutputFiles.length < 1189) {
    const book = 'ZZA';
    expectedOutputFiles.push(book + '/' + book + '_' + String(fillerChapter).padStart(3, '0') + '_words.json');
    fillerChapter += 1;
  }
  return {
    schemaVersion: 2,
    translationId: 'bsb',
    expectedChapters: 1189,
    expectedOutputFiles,
    alignerDirectory: '/tmp/bsb-align',
    audioDirectory: '/tmp/hays',
    textDirectory: '/tmp/workspace/text',
    outputDirectory: '/tmp/workspace/output',
    scriptureContentVersion: 'sha256-scripture',
    audioContentVersion: 'sha256-' + 'a'.repeat(64),
    audioInventorySha256: 'a'.repeat(64),
  };
}

test('BSB shard planner deterministically balances whole-book work without force-overwriting output', () => {
  const plan = fakePlan();
  const missing = plan.expectedOutputFiles.filter(path =>
    /^(PSA|ISA|GEN|MAT|JHN|REV|ROM|JON)\//.test(path));
  const result = buildBsbAlignmentShardPlan(plan, missing, { shardCount: 4, python: 'python3' });

  assert.equal(result.remainingChapters, 357);
  assert.equal(result.shards.length, 4);
  const assigned = result.shards.flatMap(shard => shard.books.map(row => row.book));
  assert.deepEqual([...assigned].sort(), ['GEN', 'ISA', 'JHN', 'JON', 'MAT', 'PSA', 'REV', 'ROM'].sort());
  assert.equal(new Set(assigned).size, assigned.length);
  assert.equal(result.shards.reduce((sum, shard) => sum + shard.chapters, 0), 357);
  for (const shard of result.shards) {
    for (const command of shard.commands) {
      assert.equal(command.executable, 'python3');
      assert.equal(command.cwd, plan.alignerDirectory);
      assert.ok(command.args.includes('--book'));
      assert.ok(!command.args.includes('--force'));
      assert.ok(command.args.includes(plan.outputDirectory));
    }
  }
  const loads = result.shards.map(shard => shard.chapters);
  assert.ok(Math.max(...loads) - Math.min(...loads) <= 150);
});

test('BSB shard planner rejects duplicate, foreign, and invalid work identities', () => {
  const plan = fakePlan();
  const valid = 'GEN/GEN_001_words.json';
  assert.throws(() => buildBsbAlignmentShardPlan(plan, [valid, valid], { shardCount: 2 }), /Duplicate/);
  assert.throws(() => buildBsbAlignmentShardPlan(plan, ['EXO/EXO_001_words.json'], { shardCount: 2 }), /not part/);
  assert.throws(() => buildBsbAlignmentShardPlan(plan, ['bad-path.json'], { shardCount: 2 }), /Unexpected/);
  assert.throws(() => buildBsbAlignmentShardPlan(plan, [valid], { shardCount: 0 }), /1 through 16/);
});

test('missing-output scan stays bound to the exact prepared output inventory', async () => {
  const plan = fakePlan();
  const existing = new Set([
    plan.outputDirectory + '/GEN/GEN_001_words.json',
    plan.outputDirectory + '/GEN/GEN_002_words.json',
  ]);
  const missing = await findMissingBsbAlignmentOutputs(plan, {
    accessFn: async path => {
      if (!existing.has(path)) throw new Error('missing');
    },
  });
  assert.equal(missing.length, 1187);
  assert.ok(!missing.includes('GEN/GEN_001_words.json'));
  assert.ok(missing.includes('GEN/GEN_003_words.json'));
});

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { auditBsbUpstreamTimingReuse } from '../../scripts/v6-audit-bsb-upstream-timing-reuse.mjs';
import { BSB_ALIGN_REVISION, BSB_ALIGN_TREE } from '../../scripts/v6-prepare-bsb-alignment-regeneration.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));

function reviewedGit(_directory, args) {
  if (args[0] === 'rev-parse' && args[1] === 'HEAD') return BSB_ALIGN_REVISION;
  if (args[0] === 'rev-parse' && args[1] === 'HEAD^{tree}') return BSB_ALIGN_TREE;
  if (args[0] === 'status') return '';
  throw new Error('Unexpected git query: ' + args.join(' '));
}

test('BSB upstream reuse audit is exact-revision-bound and reports missing timing corpus deterministically', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'bq-v6-bsb-reuse-audit-test-'));
  const aligner = join(temp, 'bsb-align');
  await mkdir(join(aligner, 'text'), { recursive: true });
  await mkdir(join(aligner, 'output'), { recursive: true });

  const genesis = JSON.parse(await readFile(join(root, 'data', 'packs', 'bible', 'GEN.json'), 'utf8'));
  const genesisOne = genesis.filter(row => row.c === 1).sort((a, b) => a.v - b.v).map(row => row.t).join('\n') + '\n';
  await writeFile(join(aligner, 'text', 'GEN_001_BSB.txt'), genesisOne);
  await writeFile(join(aligner, 'text', 'EXO_001_BSB.txt'), 'Deliberately incompatible Reader text.\n');

  try {
    const report = await auditBsbUpstreamTimingReuse({
      root,
      alignerDirectory: aligner,
      gitResolver: reviewedGit,
    });
    assert.equal(report.expectedChapters, 1189);
    assert.equal(report.reusableChapters, 0);
    assert.equal(report.regenerateChapters, 1189);
    assert.equal(report.reasonCounts['upstream-word-output-missing-or-invalid'], 1);
    assert.equal(report.reasonCounts['text-token-mismatch'], 1);
    assert.equal(report.reasonCounts['upstream-text-missing'], 1187);
    const exodusMismatch = report.rows.find(row => row.book === 'EXO' && row.chapter === 1);
    assert.ok(exodusMismatch?.reasons.includes('text-token-mismatch'));
    assert.equal(exodusMismatch?.reasons.includes('upstream-word-output-missing-or-invalid'), false);
    assert.equal(report.rows.length, 1189);
    assert.equal(report.alignmentRevision, BSB_ALIGN_REVISION);
    assert.equal(report.alignmentTree, BSB_ALIGN_TREE);

    await assert.rejects(
      auditBsbUpstreamTimingReuse({
        root,
        alignerDirectory: aligner,
        gitResolver: (_directory, args) => args[0] === 'status' ? ' M align_book.py' : reviewedGit(_directory, args),
      }),
      /tracked modifications/i,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { alignmentTokens, auditBsbAlignmentChapter } from '../../scripts/v6-audit-bsb-alignment-source.mjs';

test('BSB alignment audit ignores punctuation/typography but requires the same spoken tokens', () => {
  assert.deepEqual(alignmentTokens('God said, “Light!”'), ['god', 'said', 'light']);
  const result = auditBsbAlignmentChapter({
    book: 'GEN',
    chapter: 1,
    currentVerses: [
      { v: 1, t: 'In the beginning God created the heavens and the earth.' },
      { v: 2, t: 'And God said, “Let there be light.”' },
    ],
    alignmentText: 'In the beginning, God created the heavens and the earth!\nAnd God said Let there be light\n',
  });
  assert.equal(result.valid, true);
  assert.equal(result.mismatches.length, 0);
});

test('BSB alignment audit fails closed on the known truncated Genesis timing-source pattern', () => {
  const result = auditBsbAlignmentChapter({
    book: 'GEN',
    chapter: 1,
    currentVerses: [
      { v: 1, t: 'In the beginning God created the heavens and the earth.' },
      { v: 2, t: 'Now the earth was formless and void.' },
      { v: 3, t: 'And God said, “Let there be light,” and there was light.' },
      { v: 4, t: 'And God saw that the light was good.' },
      { v: 5, t: 'God called the light “day,” and the darkness He called “night.” And there was evening, and there was morning — the first day.' },
    ],
    alignmentText: [
      'In the beginning God created the heavens and the earth.',
      'Now the earth was formless and void.',
      'And God said, “Let there be light,”',
      'And God saw that the light was good.',
      'God called the light “day,” and the darkness He called “night.”',
    ].join('\n'),
  });
  assert.equal(result.valid, false);
  assert.deepEqual(result.mismatches.map(row => row.verse), [3, 5]);
  assert.match(result.mismatches[0].current, /and there was light/);
});

test('BSB alignment audit reports verse-count mismatch instead of silently reindexing verses', () => {
  const result = auditBsbAlignmentChapter({
    book: 'JUD',
    chapter: 1,
    currentVerses: [{ v: 1, t: 'Jude, a servant of Jesus Christ.' }, { v: 2, t: 'Mercy, peace, and love be multiplied to you.' }],
    alignmentText: 'Jude, a servant of Jesus Christ.\n',
  });
  assert.equal(result.valid, false);
  assert.equal(result.mismatches[0].reason, 'verse-count-mismatch');
  assert.ok(result.mismatches.some(row => row.verse === 2 && row.reason === 'text-mismatch'));
});

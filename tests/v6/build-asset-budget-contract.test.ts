import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync('scripts/v6-build-evidence.mjs', 'utf8');

test('V6 build evidence enforces image and font budgets', () => {
  for (const token of [
    'imageBytes:',
    'imageTotalBytes:',
    'fontBytes:',
    'fontTotalBytes:',
    "'.woff'",
    "'.woff2'",
    "'.ttf'",
    "'.otf'",
    "'.eot'",
    'let imageTotalBytes = 0',
    'let fontTotalBytes = 0',
    'let largestFont = { path: null, bytes: 0 }',
    'image total',
    'largest font',
    'font total',
  ]) {
    assert.ok(source.includes(token), `build evidence is missing asset-budget contract: ${token}`);
  }

  assert.match(source, /if \(imageTotalBytes > budgets\.imageTotalBytes\)/);
  assert.match(source, /if \(largestFont\.bytes > budgets\.fontBytes\)/);
  assert.match(source, /if \(fontTotalBytes > budgets\.fontTotalBytes\)/);
  assert.match(source, /largestImage,/);
  assert.match(source, /largestFont,/);
});

test('asset budgets retain reasonable current-build headroom', () => {
  assert.match(source, /imageTotalBytes: 32 \* 1024 \* 1024/);
  assert.match(source, /fontBytes: 1 \* 1024 \* 1024/);
  assert.match(source, /fontTotalBytes: 4 \* 1024 \* 1024/);
});

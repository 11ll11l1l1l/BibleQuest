import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { congregationRecognitionContract } from '../src/app/congregation-recognition.js';
import { recognitionArtworkContract, recognitionArtwork, renderRecognitionArtwork } from '../src/features/congregation-recognition/artwork.js';

const matched = Object.keys(recognitionArtworkContract.matched).sort();
const exceptions = Object.keys(recognitionArtworkContract.exceptions).sort();
const presetCodes = congregationRecognitionContract.presets.map(row => row.code).sort();

assert.deepEqual(matched, ['comeback','consistency','most-improved','pastor-recognition','scripture-explorer'], 'Recognition genuine-match inventory changed unexpectedly.');
assert.deepEqual(exceptions, ['encourager','group-helper','journey-finisher','reflection'], 'Recognition reviewed-exception inventory changed unexpectedly.');
assert.deepEqual([...matched, ...exceptions].sort(), presetCodes, 'Every supported Recognition preset must be either a genuine asset match or a reviewed exception.');
assert.equal(new Set([...matched, ...exceptions]).size, presetCodes.length, 'Recognition preset may not be both matched and excepted.');

const svg = await readFile(recognitionArtworkContract.asset, 'utf8');
for (const code of matched) {
  const item = recognitionArtwork(code);
  assert(item, `Expected reviewed Recognition artwork for ${code}.`);
  assert.match(svg, new RegExp(`id=["']${item.symbol}["']`), `Mapped symbol ${item.symbol} for ${code} is missing from the approved asset.`);
  const html = renderRecognitionArtwork(code, '<unsafe>');
  assert.match(html, /<svg[^>]+aria-hidden="true"[^>]+focusable="false"/s, `Matched Recognition artwork ${code} must remain decorative.`);
  assert.match(html, new RegExp(`assets/progress-feature-icons\\.svg#${item.symbol}`));
  assert.doesNotMatch(html, /<unsafe>/, 'Matched rendering must not leak the fallback glyph payload.');
}
for (const code of exceptions) {
  assert.equal(recognitionArtwork(code), null, `Reviewed exception ${code} must not be force-mapped.`);
  assert.ok(recognitionArtworkContract.exceptions[code].length > 20, `Reviewed exception ${code} needs an explicit rationale.`);
}
const escaped = renderRecognitionArtwork('unknown','<img src=x onerror=alert(1)>');
assert.match(escaped, /data-recognition-glyph="unknown"/);
assert.match(escaped, /&lt;img src=x onerror=alert\(1\)&gt;/, 'Backend-provided fallback glyph text must be escaped.');
assert.doesNotMatch(escaped, /<img/);

const ui = await readFile('src/features/congregation-recognition/index.js', 'utf8');
assert.match(ui, /renderRecognitionArtwork\(row\.awardCode,row\.icon\)/, 'Recognition rows must use the reviewed artwork mapper.');
assert.doesNotMatch(ui, /<option[^>]*>\$\{esc\(row\.icon\)\}/, 'Award selector must not depend on decorative emoji for meaning.');
assert.match(ui, /<option value="\$\{esc\(row\.code\)\}">\$\{esc\(row\.title\)\}<\/option>/, 'Award selector must retain a meaningful text title.');
assert.match(ui, /data-badge-id=.*aria-hidden="true"/s, 'Dynamic earned-badge artwork must remain decorative beside its badge name.');

console.log('BibleQuest V5 Recognition artwork mapping contract passed.');

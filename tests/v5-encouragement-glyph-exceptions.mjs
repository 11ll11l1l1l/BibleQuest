import fs from 'node:fs';
import assert from 'node:assert/strict';

const service = fs.readFileSync('src/app/encouragements.js', 'utf8');
const view = fs.readFileSync('src/features/encouragements/index.js', 'utf8');

const reviewed = new Map([
  ['pray', ['🙏', 'Praying for you']],
  ['cheer', ['👏', 'Keep going!']],
  ['heart', ['💛', 'Glad we’re growing together']],
  ['word', ['📖', 'Keep in the Word']],
  ['flame', ['🔥', 'Nice consistency!']],
]);

const presetBlock = service.match(/const PRESETS=Object\.freeze\(\{([\s\S]*?)\n\}\);/);
assert.ok(presetBlock, 'Encouragement PRESETS owner must remain discoverable');

const actual = new Map();
for (const match of presetBlock[1].matchAll(/\b([a-z]+):Object\.freeze\(\{emoji:'([^']+)',label:'([^']+)'\}\)/g)) {
  actual.set(match[1], [match[2], match[3]]);
}

assert.deepEqual([...actual], [...reviewed], 'Encouragement preset glyphs/labels changed: any new or changed pictograph requires a fresh genuine-match or explicit exception review');
assert.equal(actual.size, 5, 'Only the five explicitly reviewed Encouragement glyph exceptions are allowed');
for (const [kind, [glyph, label]] of actual) {
  assert.ok(glyph.trim(), `${kind} must keep a presentation glyph until separately reviewed`);
  assert.ok(label.trim(), `${kind} must keep an independent accessible text label`);
}

assert.match(view, /<span aria-hidden="true">\$\{preset\.emoji\}<\/span> \$\{esc\(preset\.label\)\}/, 'Preset buttons must hide decorative glyphs from assistive technology and expose text labels');
assert.match(view, /<span aria-hidden="true">\$\{item\.emoji\}<\/span> <b>/, 'Encouragement feed must keep decorative glyphs aria-hidden');
assert.match(view, /\$\{esc\(item\.label\)\}/, 'Encouragement feed must retain independent text labels');

console.log('PASS v5 encouragement glyph exceptions: five reviewed unmatched glyphs only; accessible meaning remains textual');

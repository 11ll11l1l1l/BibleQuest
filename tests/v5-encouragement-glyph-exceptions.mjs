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

const genuine = Object.freeze({
  pray:'/assets/v4/community/prayer-circle.png',
  heart:'/assets/v4/community/encouragements.png',
  word:'/assets/v4/decorative/mini-bible-ribbon.png',
  flame:'/assets/v4/core/streak-flame.png'
});

const presetBlock = service.match(/const PRESETS=Object\.freeze\(\{([\s\S]*?)\n\}\);/);
assert.ok(presetBlock, 'Encouragement PRESETS owner must remain discoverable');

const actual = new Map();
for (const match of presetBlock[1].matchAll(/\b([a-z]+):Object\.freeze\(\{emoji:'([^']+)',label:'([^']+)'\}\)/g)) {
  actual.set(match[1], [match[2], match[3]]);
}

assert.deepEqual([...actual], [...reviewed], 'Encouragement preset identity changed: new or changed pictographs require fresh genuine-match/exception review');
assert.equal(actual.size, 5, 'Only the five reviewed Encouragement preset identities are allowed');
for (const [kind, [glyph, label]] of actual) {
  assert.ok(glyph.trim(), `${kind} must keep a fallback/source glyph identity`);
  assert.ok(label.trim(), `${kind} must keep an independent accessible text label`);
}

for (const [kind,asset] of Object.entries(genuine)) {
  assert.ok(fs.existsSync(asset.slice(1)),`genuine Encouragement artwork must exist for ${kind}: ${asset}`);
  assert.ok(view.includes(`${kind}:'${asset}'`),`${kind} must be wired to its reviewed genuine artwork`);
}
assert.ok(!Object.hasOwn(genuine,'cheer'),'Cheer remains a reviewed explicit exception; do not force unrelated artwork');
assert.match(view,/const encouragementIcon=/,'buttons and feed must share one reviewed artwork renderer');
assert.match(view,/data-encouragement-art=/,'genuine-match artwork must expose a stable decorative hook');
assert.match(view,/data-encouragement-glyph=/,'unmatched fallback must expose a stable reviewed hook');
assert.match(view,/alt=""[^>]*aria-hidden="true"/,'genuine artwork must remain decorative so label text carries meaning');
assert.match(view,/data-encouragement-glyph="\$\{esc\(kind\)\}" aria-hidden="true">\$\{esc\(fallback\)\}/,'unmatched fallback must be escaped and hidden from assistive technology');
assert.match(view,/encouragementIcon\(kind,preset\.emoji,20\)/,'send buttons must use the artwork-aware renderer');
assert.match(view,/encouragementIcon\(item\.kind,item\.emoji,18\)/,'recent-feed rows must use the same artwork-aware renderer');
assert.match(view,/\$\{esc\(preset\.label\)\}/,'send buttons must retain independent visible labels');
assert.match(view,/\$\{esc\(item\.label\)\}/,'feed rows must retain independent visible labels');

console.log('PASS v5 encouragement artwork: four genuine matches, one reviewed exception, accessible meaning remains textual');

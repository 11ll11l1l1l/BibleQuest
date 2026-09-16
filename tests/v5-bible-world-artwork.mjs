import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('src/ui/bible-world-visual-polish.css','utf8');
const source=fs.readFileSync('src/features/bible-world/index.js','utf8');
const mappings={creation:'world-creation.png',patriarchs:'world-patriarchs.png',exodus:'world-exodus.png',kingdom:'world-kingdom.png',wisdom:'world-wisdom.png',prophets:'world-prophets.png',jesus:'world-gospels.png',church:'world-early-church.png',letters:'world-letters.png'};

for(const [region,asset] of Object.entries(mappings)){
  const path=`assets/v4/bible-world/${asset}`;
  assert.ok(fs.existsSync(path),`exact Bible World artwork must exist: ${path}`);
  assert.ok(fs.statSync(path).size>1000,`Bible World artwork must not be empty: ${path}`);
  assert.ok(source.includes(`${region}:'${asset}'`),`missing exact region artwork mapping: ${region}`);
}

assert.match(css,/\.bq-world-icon img\{display:block;width:100%;height:100%;object-fit:contain\}/,'region artwork must remain contained');
assert.match(source,/class="bq-world-icon" aria-hidden="true"><img /,'region artwork must remain decorative');
for(const token of ['region.title','region.books.join','aria-label="${esc(region.title)} exploration"'])
  assert.ok(source.includes(token),`accessible region meaning must remain independent of artwork: ${token}`);

console.log('V5 Bible World exact region artwork contract: PASS');

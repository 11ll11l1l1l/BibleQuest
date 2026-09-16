import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('src/ui/bible-world-v5-art.css','utf8');
const source=fs.readFileSync('src/features/bible-world/index.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const mappings={creation:'world-creation.png',patriarchs:'world-patriarchs.png',exodus:'world-exodus.png',kingdom:'world-kingdom.png',wisdom:'world-wisdom.png',prophets:'world-prophets.png',jesus:'world-gospels.png',church:'world-early-church.png',letters:'world-letters.png'};

assert.ok(html.includes('src/ui/bible-world-v5-art.css'),'Bible World V5 artwork stylesheet must load');
for(const [region,asset] of Object.entries(mappings)){
  const path=`assets/v4/bible-world/${asset}`;
  assert.ok(fs.existsSync(path),`exact Bible World artwork must exist: ${path}`);
  assert.ok(fs.statSync(path).size>1000,`Bible World artwork must not be empty: ${path}`);
  assert.ok(css.includes(`[data-world-region="${region}"]>.bq-world-icon`),`missing stable region artwork selector: ${region}`);
  assert.ok(css.includes(`url('/${path}')`),`missing exact region artwork mapping: ${region}`);
}

assert.match(css,/\.bq-world-region>\.bq-world-icon\{font-size:0;/,'source glyph font must be hidden when exact artwork is available');
assert.match(source,/class="bq-world-icon" aria-hidden="true"/,'region artwork must remain decorative');
for(const token of ['region.title','region.books.join','aria-label="${esc(region.title)} exploration"'])
  assert.ok(source.includes(token),`accessible region meaning must remain independent of artwork: ${token}`);

console.log('V5 Bible World exact region artwork contract: PASS');

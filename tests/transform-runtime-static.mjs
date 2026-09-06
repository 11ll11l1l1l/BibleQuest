import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const html=read('transform.html');
const headers=read('_headers');
const runtime=read('transformation-v2.js');

assert.match(html,/<script src="transformation-v2\.js"><\/script>/,'Transform must keep the isolated v2 runtime on its standalone entry');
assert.match(html,/api\.mode==='rebuilt-v2'/,'Transform bootstrap must reject unrelated or incomplete runtime globals');
assert.match(html,/transformation-v2\.js\?bq-recover=/,'Transform bootstrap must have a cache-busting clean-runtime recovery path');
assert.match(html,/if\(!root\)root=await recoverAndOpen\(\)/,'Transform must attempt clean recovery before showing a startup failure');
assert.match(html,/GATE_TIMEOUT_MS=8000/,'Transform account verification must have a finite timeout');
assert.match(html,/Promise\.race\(\[/,'Transform startup must bound a stalled account-gate promise');
assert.match(html,/T-GATE-MISSING/,'Transform must visibly recover when the standalone account gate did not load');
assert.match(html,/T-GATE-TIMEOUT/,'Transform must visibly recover when account verification stalls');
assert.match(html,/document\.documentElement\.classList\.add\('bq-account-confirmed'\)/,'Transform failure UI must become visible instead of remaining hidden behind the account gate');
assert.match(html,/RECOVERY_TIMEOUT_MS=8000/,'Transform runtime recovery must have a finite timeout');
assert.match(html,/data-bq-transform-retry/,'Transform hard failure must remain retryable without clearing user data');
assert.doesNotMatch(html,/localStorage\.(?:clear|removeItem)\(/,'Transform startup recovery must never erase saved reflection data');
const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(inlineScripts.length,'Transform bootstrap inline script is missing');
new Function(inlineScripts.at(-1)[1]);

assert.match(runtime,/window\.BQ_TRANSFORMATION=\{open,close,mode:'rebuilt-v2'/,'rebuilt-v2 runtime export is missing');
assert.match(runtime,/root\.className='bq-transform-v2'/,'rebuilt-v2 runtime root contract changed unexpectedly');

const runtimeHeader=headers.match(/\/transformation-v2\.js\n([\s\S]*?)(?=\n\/|$)/)?.[1]||'';
const pageHeader=headers.match(/\/transform\n([\s\S]*?)(?=\n\/|$)/)?.[1]||'';
for(const [name,block] of [['Transform runtime',runtimeHeader],['Transform page',pageHeader]]){
  assert.match(block,/Cache-Control:\s*no-cache, no-store, max-age=0, must-revalidate/,`${name} must not be served as a stale deployment asset`);
}

console.log('Transform runtime startup/recovery static guard passed');

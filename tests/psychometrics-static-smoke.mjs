import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const context={window:{}};
vm.createContext(context);
vm.runInContext(read('psychometrics-data-neo.js'),context);
vm.runInContext(read('psychometrics-data-via.js'),context);

const neo=context.window.BQ_PSYCH_NEO;
const via=context.window.BQ_PSYCH_VIA;
const rse=context.window.BQ_PSYCH_RSE;
const html=read('psychometrics.html');
const suite=read('psychometrics-suite.js');
const launcher=read('transform-launcher.js');
const sw=read('sw.js');
const cacheVersion=Number(sw.match(/const CACHE='biblequest-v(\d+)'/)?.[1]||0);

assert.equal(neo.length,30,'IPIP-NEO-120 must expose 30 facets');
assert.equal(neo.reduce((n,f)=>n+f[3].length,0),120,'IPIP-NEO-120 must expose exactly 120 items');
assert.deepEqual([...new Set(neo.map(f=>f[1]))].sort(),['A','C','E','N','O'],'IPIP-NEO domains changed');
assert.ok(neo.every(f=>f[3].length===4&&f[3].every(x=>x[1]===1||x[1]===-1)),'NEO facets must have four keyed items');

assert.equal(via.length,24,'IPIP-VIA-R must expose 24 character strengths');
assert.equal(via.reduce((n,s)=>n+s[2].length,0),96,'IPIP-VIA-R must expose exactly 96 items');
assert.ok(via.every(s=>s[2].filter(x=>x[1]===1).length===2&&s[2].filter(x=>x[1]===-1).length===2),'VIA-R scales must remain balanced 2 positive / 2 negative');

assert.equal(rse.length,10,'Rosenberg Self-Esteem Scale must contain 10 items');
assert.equal(rse.filter(x=>x[1]===1).length,5,'RSE positive-key count changed');
assert.equal(rse.filter(x=>x[1]===-1).length,5,'RSE reverse-key count changed');

assert.match(html,/psychometrics-data-neo\.js/);
assert.match(html,/psychometrics-data-via\.js/);
assert.match(html,/psychometrics-suite\.js/);
assert.match(suite,/not a clinical diagnosis|do not diagnose mental illness/i,'non-diagnostic boundary must remain visible');
assert.match(suite,/Raw scale means, not invented population percentiles/i,'NEO results must not invent norm percentiles');
assert.match(suite,/no discrete universal cutoffs/i,'RSE must not invent universal cutoffs');
assert.match(suite,/more than 80%|straight-lining/i,'long-form assessments need a basic response-quality check');
assert.match(launcher,/Psychometrics Lab/,'Grow launcher must expose the Psychometrics Lab');
assert.match(launcher,/\.\/psychometrics\.html/,'launcher must use deployment-relative Psychometrics URL');
assert.ok(cacheVersion>=55,`PWA cache generation must include Psychometrics Lab baseline v55+, got v${cacheVersion||'missing'}`);
for(const asset of ['psychometrics.html','psychometrics.css','psychometrics-data-neo.js','psychometrics-data-via.js','psychometrics-suite.js'])assert.ok(sw.includes(`'./${asset}'`),`PWA shell missing ${asset}`);

console.log(`Psychometrics Lab static smoke passed · PWA v${cacheVersion}`);

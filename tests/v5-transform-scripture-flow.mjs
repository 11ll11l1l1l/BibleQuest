import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTransformEngine } from '../src/engines/transform.js';

const memory={value:null,read(_key,fallback){return this.value??fallback},write(_key,value){this.value=structuredClone(value);return structuredClone(value)}};
const engine=createTransformEngine({storage:memory,clock:()=>new Date('2026-09-17T00:00:00Z')});
const flow={scripture:'James 1:19–20',understand:'James addresses anger and careful listening in a life shaped by God’s word.',reflect:'I answer too quickly when I feel criticized.',apply:'Pause and summarize before replying in the next difficult conversation.',pray:'God, give me humility to listen and gentleness to answer.'};
const saved=engine.saveReflection(flow);
assert.equal(saved.applied,true);
assert.deepEqual(Object.fromEntries(Object.keys(flow).map(key=>[key,saved.state.reflection[key]])),flow);
assert.equal(saved.state.history.at(-1).summary,flow.apply);
const resumed=createTransformEngine({storage:memory}).getState();
assert.equal(resumed.reflection.scripture,flow.scripture);
assert.equal(resumed.reflection.pray,flow.pray);

const feature=await readFile(new URL('../src/features/transform/index.js',import.meta.url),'utf8');
for(const hook of ['data-transform-flow-scripture','data-transform-flow-understand','data-transform-flow-reflect','data-transform-flow-apply','data-transform-flow-pray','data-transform-flow-save'])assert.match(feature,new RegExp(hook));
assert.match(feature,/copy\('completeScripture'\)/);
console.log('BibleQuest v5 Transformation Scripture-to-prayer flow regression passed.');

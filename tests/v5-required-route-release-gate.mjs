import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deployGate=await readFile(new URL('../scripts/deploy-gate.mjs',import.meta.url),'utf8');

for(const route of ['bible-quest','explorer','challenges']){
  assert.match(deployGate,new RegExp(`route:'${route}'`),`${route} must remain in the deployment route inventory`);
}
assert.match(deployGate,/missing implementation file/,'deployment must reject missing V5 implementation modules');
assert.match(deployGate,/'navigation entry':contract\.entry/,'deployment must reject unreachable V5 routes');

console.log('PASS V5 required-route deployment gate contract');

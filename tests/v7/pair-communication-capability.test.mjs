import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDiscipleshipService } from '../../src/app/discipleship.js';
import { PAIR_COMMUNICATION_CAPABILITIES } from '../../src/features/pairing/capabilities.js';
import { createPairingController } from '../../src/features/pairing/controller.js';

const session={getState:()=>({authenticated:true,user:{id:'11111111-1111-1111-1111-111111111111'}})};
const membership={getActive:()=>({userId:'11111111-1111-1111-1111-111111111111',congregationId:'22222222-2222-2222-2222-222222222222'})};

test('ONE 2 ONE communication contract exposes explicit response sharing without generic pair messaging',()=>{
  assert.deepEqual(PAIR_COMMUNICATION_CAPABILITIES,{
    lessonResponseSharing:true,
    directPairMessaging:false,
  });
  assert.equal(Object.isFrozen(PAIR_COMMUNICATION_CAPABILITIES),true);

  const controller=createPairingController({service:{},getActorId:()=>session.getState().user.id});
  assert.strictEqual(controller.communicationCapabilities,PAIR_COMMUNICATION_CAPABILITIES);
  controller.dispose();

  const service=createDiscipleshipService({repository:{},session,membership});
  assert.equal(typeof service.shareResponse,'function');
  assert.equal(typeof service.revokeResponseShare,'function');
  for(const unsupported of ['sendMessage','listMessages','openThread','createThread']) assert.equal(unsupported in service,false);
});

test('pairing UI does not expose a generic private-message action',async()=>{
  const source=await readFile(new URL('../../src/features/pairing/index.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/data-pair-action=["'](?:message|chat|thread|send-message)["']/i);
});

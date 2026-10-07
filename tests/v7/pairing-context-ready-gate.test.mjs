import test from 'node:test';
import assert from 'node:assert/strict';
import { pairingPage } from '../../src/features/pairing/index.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
const pair=Object.freeze({id:'pair-1',mentorId:'user-1',menteeId:'user-2',state:'invited'});

test('pairing page does not read pair data until shared context is ready',async()=>{
  let ready=false,reads=0,contextListener=null;
  const handlers={};
  const host={innerHTML:''};
  const root={
    querySelector(selector){return selector==='[data-pairing]'?host:{checked:false};},
    addEventListener(name,handler){handlers[name]=handler;},
    removeEventListener(name){delete handlers[name];},
  };
  const page=pairingPage({
    service:{async getPair(){reads++;return pair;}},
    session:{getState:()=>({user:{id:'user-1'}})},
    pairId:pair.id,
    isContextReady:()=>ready,
    subscribeContext(listener){contextListener=listener;return()=>{contextListener=null;};},
    onBack(){},onAccount(){},onCongregation(){},onLessons(){},
  });
  const cleanup=page.mount(root);
  await flush();
  assert.equal(reads,0);

  handlers.click({target:{closest:()=>({disabled:false,getAttribute:name=>name==='data-pair-action'?'reload':null})}});
  await flush();
  assert.equal(reads,0);

  ready=true;
  contextListener();
  await flush();
  assert.equal(reads,1);
  assert.match(host.innerHTML,/data-pair-action="accept"/);

  cleanup();
  assert.equal(contextListener,null);
  assert.equal(Object.keys(handlers).length,0);
});

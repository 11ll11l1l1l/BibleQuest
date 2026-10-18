import test from 'node:test';
import assert from 'node:assert/strict';
import { createPushSubscriptionService } from '../../src/app/push-subscription.js';

test('sign-out cleanup finishes when service worker installation is blocked',async()=>{
  let beforeSignOut,owner='host',removed=0;
  const service=createPushSubscriptionService({
    session:{getState:()=>({authenticated:true,user:{id:'host'}}),beforeSignOut(fn){beforeSignOut=fn;return()=>{}}},
    persistence:{save:async()=>{},remove:async()=>{removed++}},
    serviceWorker:{ready:new Promise(()=>{}),getRegistration:async()=>undefined},
    notification:{permission:'default'},
    ownerStorage:{getItem:()=>owner,setItem:(_key,value)=>{owner=value},removeItem:()=>{owner=''}},
  });
  let timer;
  try{await Promise.race([beforeSignOut(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Cleanup waited for an uninstalled worker')),200)})])}
  finally{clearTimeout(timer);service.dispose()}
  assert.equal(owner,'');assert.equal(removed,0);
});

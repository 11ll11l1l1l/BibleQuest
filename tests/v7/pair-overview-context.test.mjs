import test from 'node:test';
import assert from 'node:assert/strict';
import { oneToOnePage } from '../../src/features/one-to-one/index.js';
import { localization } from '../../src/app/localization.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(service,{ready=()=>false}={}){
  let context,unsubscribed=false;const nodes=new Map(),opened=[];
  function node(selector){if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',handlers:new Map(),addEventListener(name,fn){this.handlers.set(name,fn);},removeEventListener(name){this.handlers.delete(name);}});return nodes.get(selector);}
  const page=oneToOnePage({service,isContextReady:ready,subscribeContext:fn=>{context=fn;return()=>{unsubscribed=true;};},onAccount(){},onCongregation(){},onBack(){},onPair:id=>opened.push(id)});
  const cleanup=page.mount({querySelector:node});
  return {page,node,opened,notify:()=>context(),cleanup,get unsubscribed(){return unsubscribed;}};
}
test('overview waits for shared account and congregation readiness before backend reads',async()=>{
  let ready=false,reads=0;const f=fixture({listPairs:async()=>{reads++;if(!ready)throw new Error('Session not hydrated');return [{id:'pair',state:'invited'}];}},{ready:()=>ready});
  await flush();assert.equal(reads,0);assert.equal(f.node('[data-pair-results]').innerHTML,'');assert.equal(f.node('[data-pair-status]').textContent,localization.t('v7.pairing.overviewChanged'));
  f.node('[data-pair-retry]').handlers.get('click')();await flush();assert.equal(reads,0);
  f.notify();await flush();assert.equal(reads,0);
  ready=true;f.notify();await flush();assert.equal(reads,1);assert.match(f.node('[data-pair-results]').innerHTML,/data-open-pair="pair"/);
  f.node('[data-pair-results]').handlers.get('click')({target:{closest:()=>({getAttribute:()=> 'pair'})}});assert.deepEqual(f.opened,['pair']);
  f.cleanup();f.notify();await flush();assert.equal(reads,1);assert.equal(f.unsubscribed,true);assert.equal(f.node('[data-pair-results]').handlers.size,0);
});
test('late overview results from an old congregation cannot replace the new context',async()=>{
  let oldResolve,newResolve,reads=0;const f=fixture({listPairs:()=>new Promise(resolve=>{if(++reads===1)oldResolve=resolve;else newResolve=resolve;})},{ready:()=>true});
  f.notify();newResolve([{id:'new-pair',state:'active'}]);await flush();oldResolve([{id:'old-pair',state:'active'}]);await flush();
  assert.match(f.node('[data-pair-results]').innerHTML,/new-pair/);assert.doesNotMatch(f.node('[data-pair-results]').innerHTML,/old-pair/);f.cleanup();
});
test('overview labels and states follow English, Tagalog and Cebuano and do not expose backend diagnostics',async()=>{
  const storage=new Map(),previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}});
  try{
    for(const locale of ['en','tl','ceb']){
      localization.setLocale(locale);assert.equal(localization.getLocale(),locale);
      const f=fixture({listPairs:async()=>[]},{ready:()=>true});await flush();
      assert.ok(f.page.html.includes(localization.t('v7.pairing.overviewIntro')));assert.ok(f.page.html.includes(localization.t('v7.pairing.backGrow')));
      if(locale!=='en')assert.doesNotMatch(f.page.html,/Your mentor and mentee relationships|Choose congregation|Back to Grow/);
      assert.equal(f.node('[data-pair-status]').textContent,localization.t('v7.pairing.overviewEmpty'));f.cleanup();
      const denied=fixture({listPairs:async()=>{throw new Error('SQL_INTERNAL_PRIVATE_DETAILS');}},{ready:()=>true});await flush();
      assert.equal(denied.node('[data-pair-status]').textContent,localization.t('v7.pairing.error'));assert.doesNotMatch(denied.node('[data-pair-status]').textContent,/SQL_INTERNAL/);denied.cleanup();
    }
  }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;}
});

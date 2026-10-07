import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCongregationMembershipService } from '../../src/app/congregation-membership.js';
import { createLibraryService } from '../../src/features/library/service.js';

test('congregation changes invalidate pending Library reads and clearing resets scoped errors', async () => {
  let finish;
  const library = createLibraryService({repository:{
    listPublished: () => new Promise(resolve => { finish = resolve; }),
    getPublishedById: async () => { throw new Error('old scope error'); },
  }});
  const membership = createCongregationMembershipService({
    session:{getState:()=>({authenticated:true,user:{id:'user'}})},
    api:{congregation:{listMemberships:async()=>['a','b'].map(id=>({user_id:'user',congregation_id:id,role:'member',congregation:{id,active:true}}))}},
    onContextChange:()=>library.reset(),
  });
  await membership.load();
  membership.setActive('a');
  const pending = library.list();
  membership.setActive('b');
  assert.equal(library.getState().status, 'idle');
  finish({items:[],nextCursor:null});
  await pending;
  assert.equal(library.getState().status, 'idle');
  await library.getItem('old');
  assert.equal(library.getState().status, 'error');
  membership.clear();
  assert.equal(library.getState().error, null);
});

test('bootstrap connects Library reset to account lifecycle and disposal', () => {
  const source = readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  assert.match(source, /onContextChange:\(\)=>\{library\.reset\(\);notifyV7Context\(\)\}/);
  assert.match(source, /unsubscribeLibrarySession=store\.subscribe/);
  assert.match(source, /JSON\.stringify\(\[current\.authenticated===true,current\.user\?\.id/);
  assert.match(source, /unsubscribeLibrarySession\(\);library\.reset\(\)/);
  assert.match(source, /library:\(\)=>libraryPage\(\{service:library,[\s\S]*isContextReady:v7ContextReady,subscribeContext:subscribeV7Context/);
  assert.match(source, /'library-item':\(\)=>libraryItemPage\(\{service:library,[\s\S]*isContextReady:v7ContextReady,subscribeContext:subscribeV7Context/);
});

test('bootstrap preserves Library taxonomy through browse, item, reload, and return routes', () => {
  const source = readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  assert.match(source, /if\(context\.taxonomyId\)params\.set\('taxonomyId',context\.taxonomyId\)/);
  assert.match(source, /initialTaxonomyId:libraryParams\(\)\.get\('taxonomyId'\)\|\|''/);
  assert.match(source, /'library-item':\(\)=>libraryItemPage\([\s\S]*taxonomyId:libraryParams\(\)\.get\('taxonomyId'\)\|\|''/);
});

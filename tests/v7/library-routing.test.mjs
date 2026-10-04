import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../../src/app/router.js';
import { createLibraryItemPage } from '../../src/features/library/item-page.js';

test('router retains encoded item/search context on navigation and history resolution', () => {
  const saved=Object.fromEntries(['window','location','history'].map(key=>[key,globalThis[key]]));
  const handlers={};
  const location={href:'https://example.test/#/learn',hash:'#/learn'};
  globalThis.location=location;
  globalThis.window={addEventListener:(name,fn)=>{handlers[name]=fn}};
  globalThis.history={pushState:(_state,_title,url)=>{location.hash=url;location.href='https://example.test/'+url}};
  try{
    const resolved=[];
    const router=createRouter({routes:{learn:()=>{},library:()=>{},'library-item':()=>{},'not-found':()=>{}},onRoute:key=>resolved.push(key)});
    router.start();
    router.navigate('library-item?id=item%2F1&query=faith+%26+hope&contentType=book');
    assert.equal(router.current(),'library-item');
    assert.equal(new URLSearchParams(location.hash.split('?')[1]).get('id'),'item/1');
    assert.equal(new URLSearchParams(location.hash.split('?')[1]).get('query'),'faith & hope');
    router.navigate('library?query=faith+%26+hope&contentType=book');
    handlers.popstate();
    assert.equal(resolved.at(-1),'library');
    router.navigate('reader');
    assert.equal(location.hash,'#/reader');
    assert.equal(resolved.at(-1),'not-found');
  }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
});

test('shared item page escapes metadata, clears stale content and releases listeners', () => {
  let listener,requested,disposed=false;
  const host={innerHTML:'',set textContent(value){this.innerHTML=value},get textContent(){return this.innerHTML}};
  const button={addEventListener(){},removeEventListener(){}};
  const service={subscribe(fn){listener=fn;return()=>{disposed=true}},async getItem(id){requested=id}};
  const page=createLibraryItemPage({service,id:'published',onBack:()=>{}});
  const cleanup=page.mount({querySelector:selector=>selector==='[data-library-detail]'?host:button});
  assert.equal(requested,'published');
  listener({status:'ready',selectedItem:{title:'<script>',summary:'text',source:{title:'Original'},rights:{attribution:'Author',basis:'Public domain',allowedUses:['link']}}});
  assert.match(host.innerHTML,/&lt;script&gt;/);
  assert.doesNotMatch(host.innerHTML,/<script>/);
  listener({status:'idle'});
  assert.doesNotMatch(host.innerHTML,/Original/);
  cleanup();
  assert.equal(disposed,true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {localization} from '../../src/app/localization.js';
const pageUrl=new URL('../../src/features/media-files/index.js',import.meta.url);
const source=(await readFile(pageUrl,'utf8')).replace("import './media-files.css';",'').replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,pageUrl).href}'`);
const {mediaFilesPage}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const asset={id:'file-a',name:'Private A.pdf',state:'pending_review',own:true,byteSize:200,revision:1};
const response=(assets=[asset],cursor=null)=>({assets,cursor,quota:{enabled:false},canReview:false});
function fixture(locale='en'){
  const old={localStorage:globalThis.localStorage,FormData:globalThis.FormData};
  const local=new Map();globalThis.localStorage={getItem:key=>local.get(key)??null,setItem:(key,value)=>local.set(key,value),removeItem:key=>local.delete(key)};
  localization.setLocale(locale);
  globalThis.FormData=class{constructor(form){this.values=form.values;}get(key){return this.values[key]??null;}};
  let userId='alice',congregationId='church-a',notify,html='',reply=async()=>response();
  const listeners=new Map(),calls=[];
  const view={get innerHTML(){return html;},set innerHTML(value){html=value;},contains:()=>true,addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)};
  const api={centralMedia:{request:async(payload,signal)=>{calls.push({payload:structuredClone(payload),signal});return reply(payload);}}};
  const page=mediaFilesPage({api,session:{getState:()=>({authenticated:Boolean(userId),user:{id:userId}})},congregation:{getActive:()=>({userId,congregationId})},subscribeContext:fn=>{notify=fn;return()=>{};}});
  const dispose=page.mount({querySelector:()=>view});
  return {calls,html:()=>html,setReply:fn=>{reply=fn;},
    filter:values=>listeners.get('submit')({preventDefault(){},target:{values,matches:selector=>selector==='[data-media-filters]'}}),
    click:(action,id='')=>{const node={dataset:{action,id},closest:selector=>selector==='[data-action]'?node:null};return listeners.get('click')({target:node});},
    switch:(user,church,emit=true)=>{userId=user;congregationId=church;if(emit)notify();},
    close(){dispose();globalThis.localStorage=old.localStorage;globalThis.FormData=old.FormData;},
  };
}
test('filter form applies server filters, resets cursor, preserves them for More and Refresh, and clears cleanly',async()=>{
  const f=fixture();
  try{
    await flush();
    assert.match(f.html(),/data-media-filters/);
    assert.match(f.html(),/Search filenames/);
    const cursor={createdAt:'2026-11-01T00:00:00Z',id:'page-1',filters:{scope:'mine',state:'pending_review',query:'Sunday'}};
    f.setReply(async()=>response([asset],cursor));
    await f.filter({scope:'mine',state:'pending_review',query:' Sunday '});
    assert.deepEqual(f.calls.at(-1).payload.filters,{scope:'mine',state:'pending_review',query:'Sunday'});
    assert.equal(f.calls.at(-1).payload.cursor,undefined);
    f.setReply(async()=>response([{...asset,id:'file-b',name:'Sunday.pdf'}]));
    await f.click('more');
    assert.deepEqual(f.calls.at(-1).payload.cursor,cursor);
    assert.match(f.html(),/Private A.pdf/);assert.match(f.html(),/Sunday.pdf/);
    await f.click('refresh');
    assert.equal(f.calls.at(-1).payload.cursor,undefined);
    assert.equal(f.calls.at(-1).payload.filters.scope,'mine');
    await f.click('clear-filters');
    assert.deepEqual(f.calls.at(-1).payload.filters,{scope:'all',state:'',query:''});
    assert.equal(f.calls.at(-1).payload.cursor,undefined);
  }finally{f.close();}
});
test('empty/error filters are recoverable and query text is escaped',async()=>{
  const f=fixture();
  try{
    await flush();f.setReply(async()=>response([]));
    await f.filter({scope:'mine',state:'rejected',query:'<img src=x onerror=bad>'});
    assert.match(f.html(),/No matching files/);assert.match(f.html(),/&lt;img/);assert.doesNotMatch(f.html(),/<img src=x/);
    f.setReply(async()=>{throw new Error('MEDIA_FILTER_INVALID');});
    await f.filter({scope:'mine',state:'rejected',query:'*'});
    assert.match(f.html(),/without \*/);
    f.setReply(async()=>response([]));await f.click('clear-filters');assert.match(f.html(),/No files yet/);
  }finally{f.close();}
});
test('account change before notification rejects stale controls and clears old filters and results',async()=>{
  const f=fixture();
  try{
    await flush();f.switch('bob','church-b',false);f.setReply(async()=>response([]));
    await f.filter({scope:'mine',query:'private-alice'});await flush();
    assert.equal(f.calls.at(-1).payload.congregationId,'church-b');
    assert.deepEqual(f.calls.at(-1).payload.filters,{scope:'all',state:'',query:''});
    assert.doesNotMatch(f.html(),/Private A.pdf|private-alice/);
    assert.ok(f.calls[0].signal.aborted);
  }finally{f.close();}
});
test('late filtered response cannot repopulate another congregation',async()=>{
  const f=fixture();
  try{
    await flush();let resolve;
    f.setReply(()=>new Promise(done=>{resolve=done;}));
    const pending=f.filter({scope:'mine',query:'secret-alice'});
    f.setReply(async()=>response([{...asset,name:'New congregation.pdf'}]));f.switch('bob','church-b');await flush();
    resolve(response([{...asset,name:'LATE PRIVATE.pdf'}]));await pending;await flush();
    assert.match(f.html(),/New congregation.pdf/);assert.doesNotMatch(f.html(),/LATE PRIVATE|secret-alice/);
  }finally{f.close();}
});
test('guest does not list media; new filter controls use actual TL/CEB locale copy',async()=>{
  for(const [locale,label]of [['tl','Mga upload ko'],['ceb','Akong mga upload']]){
    const f=fixture(locale);
    try{await flush();assert.ok(f.html().includes(label));f.switch(null,null);await flush();const count=f.calls.length;assert.doesNotMatch(f.html(),/data-media-filters/);await f.click('refresh');assert.equal(f.calls.length,count);}finally{f.close();}
  }
});

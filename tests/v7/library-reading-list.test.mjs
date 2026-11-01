import test from 'node:test';
import assert from 'node:assert/strict';
import {createLibraryReadingList} from '../../src/features/library/reading-list.js';
import {mountReadingListPanel} from '../../src/features/library/reading-list-panel.js';
import {createLibraryItemPage} from '../../src/features/library/item-page.js';
const item = patch => ({
  id:'reading',contentType:'past_teaching',publishedRevisionId:'r1',publicationState:'published',title:'Reading title',sourceLocale:'en',locale:'en',
  source:{kind:'first_party',title:'Source',catalogId:'reading'},sourceContent:{title:'Reading title',body:'SECRET_PROSE'},
  rights:{status:'verified',holder:'BibleQuest',basis:'Original',attribution:'BibleQuest',allowedUses:['display']},review:{status:'approved',reviewer:'editor',decidedAt:'2026-11-01T00:00:00Z'},taxonomyLinks:[],translations:[],privateReflection:'SECRET_NOTE',...patch,
});
function fixture(){let owner='guest';const values=new Map();const storage={read:(key,fallback)=>structuredClone(values.get(key)??fallback),write:(key,value)=>{values.set(key,structuredClone(value));return value;}};return {values,storage,owner:value=>{owner=value;},getOwner:()=>owner,list:createLibraryReadingList({storage,getOwner:()=>owner})};}
test('save/deduplicate/reload/remove retains metadata only and reuses owner-scoped private storage',()=>{
  const f=fixture();f.list.save(item());f.list.save(item({title:'Updated title'}));
  const raw=JSON.stringify([...f.values]);assert.doesNotMatch(raw,/SECRET_PROSE|SECRET_NOTE|sourceContent|rights|revision/);
  assert.equal(f.list.list().length,1);assert.equal(f.list.list()[0].title,'Updated title');
  const reload=createLibraryReadingList({storage:f.storage,getOwner:f.getOwner});assert.equal(reload.list().length,1);
  f.owner('account:bob');assert.equal(reload.list().length,0);assert.throws(()=>reload.remove('reading','guest'),{code:'BQ_READING_LIST_OWNER'});
  assert.throws(()=>reload.save(item(),'guest'),{code:'BQ_READING_LIST_OWNER'});
  f.owner('guest');reload.remove('reading');assert.deepEqual(reload.list(),[]);
});
test('publication/review/rights denials do not save; external-link books remain metadata-only',()=>{
  const f=fixture();for(const patch of [{publicationState:'draft'},{review:{status:'pending_review'}},{rights:{status:'unknown'}}])assert.throws(()=>f.list.save(item(patch)));
  assert.equal(f.values.size,0);
  f.list.save(item({contentType:'book',rights:{...item().rights,allowedUses:['external_link']}}));assert.equal(f.list.list()[0].contentType,'book');
});
test('unknown storage versions and write failures retain previous data; capacity is explicit',()=>{
  const f=fixture();f.values.set('library-reading-list.v1.guest',{version:99,items:[]});
  assert.throws(()=>f.list.save(item()),{code:'BQ_READING_LIST_FORMAT'});assert.equal(f.values.get('library-reading-list.v1.guest').version,99);
  f.values.set('library-reading-list.v1.guest',{version:1,items:Array(101).fill(null)});
  const oversized=structuredClone([...f.values]);assert.throws(()=>f.list.save(item()),{code:'BQ_READING_LIST_FORMAT'});assert.deepEqual([...f.values],oversized);
  f.values.clear();for(let index=0;index<100;index++)f.list.save(item({id:`reading-${index}`}));
  assert.throws(()=>f.list.save(item()),{code:'BQ_READING_LIST_FULL'});assert.equal(f.list.list().length,100);
  const before=structuredClone([...f.values]);f.storage.write=()=>{throw new Error('quota');};assert.throws(()=>f.list.remove('reading-0'));assert.deepEqual([...f.values],before);
});
function panelFixture(f,locale='en'){
  const events=new Map(),opened=[];let markup='';const details={open:false};let focused=false;
  const host={get innerHTML(){return markup;},set innerHTML(value){markup=value;},contains:()=>true,closest:()=>details,querySelectorAll:()=>[{dataset:{id:'reading'},focus:()=>{focused=true;}}],addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
  const panel=mountReadingListPanel({host,readingList:f.list,locale,navigate:target=>opened.push(target)});
  return {host,opened,panel,details,focused:()=>focused,click:(action,id='reading')=>{const button={dataset:{readingListAction:action,id},closest:()=>button};events.get('click')?.({target:button});}};
}
test('saved panel opens canonical lookup, escapes titles, removes links and blocks stale-owner controls',()=>{
  const f=fixture();f.list.save(item({title:'<script>title</script>'}));const p=panelFixture(f);
  assert.doesNotMatch(p.host.innerHTML,/<script>/);p.click('open');assert.deepEqual(p.opened,[{routeKey:'library-item',resourceId:'reading'}]);
  assert.equal(p.panel.focus('reading'),true);assert.equal(p.details.open,true);assert.equal(p.focused(),true);
  f.owner('account:other');p.click('remove');assert.match(p.host.innerHTML,/No saved readings/);f.owner('guest');assert.equal(f.list.list().length,1);
  p.panel.refresh();p.click('remove');assert.equal(f.list.list().length,0);p.panel.dispose();
});
test('saved panel renders TL/CEB empty states and recovers from storage errors',()=>{
  const f=fixture();for(const [locale,label]of [['tl','Wala pang naka-save'],['ceb','Wala pay gi-save']]){const p=panelFixture(f,locale);assert.ok(p.host.innerHTML.includes(label));p.panel.dispose();}
  f.values.set('library-reading-list.v1.guest',{version:99});const p=panelFixture(f);assert.match(p.host.innerHTML,/Reading list unavailable/);f.values.clear();p.click('refresh');assert.match(p.host.innerHTML,/No saved readings/);p.panel.dispose();
});
test('actual item control saves/removes only the loaded published record and rejects account-switch clicks',()=>{
  const f=fixture();let render,context;const events=new Map(),savedHost={innerHTML:''};
  const host={innerHTML:'',textContent:'',setAttribute(){},focus(){},contains:()=>true,querySelector:()=>savedHost,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
  const button={addEventListener(){},removeEventListener(){}};
  const reads=[];const service={subscribe:fn=>{render=fn;return()=>{};},getItem:id=>reads.push(id)};
  const dispose=createLibraryItemPage({service,id:'reading',onBack(){},readingListStorage:f.storage,getReadingListOwner:f.getOwner,subscribeContext:fn=>{context=fn;return()=>{};}}).mount({querySelector:selector=>selector==='[data-library-detail]'?host:button});
  const click=()=>{const target={dataset:{readingListSaveAction:'toggle'},closest:()=>target};events.get('click')({target});};
  assert.deepEqual(reads,['reading'],'saved links still resolve through current Library lookup');
  render({status:'ready',selectedItem:item()});click();assert.equal(f.list.list().length,1);assert.match(savedHost.innerHTML,/Saved on this device/);
  click();assert.equal(f.list.list().length,0);
  const write=f.storage.write;f.storage.write=()=>{throw new Error('quota');};click();assert.match(savedHost.innerHTML,/Reading list unavailable/);assert.equal(f.list.list().length,0);f.storage.write=write;
  f.owner('account:bob');click();assert.equal(f.values.has('library-reading-list.v1.account:bob'),false);
  context();render({status:'not-found'});click();assert.equal(f.values.has('library-reading-list.v1.account:bob'),false);dispose();
});

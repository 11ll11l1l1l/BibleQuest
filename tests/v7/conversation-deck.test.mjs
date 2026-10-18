import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONVERSATION_SERIES, CONVERSATION_CARDS, conversationText, normalizeConversationDeck } from '../../src/content/conversation-decks.js';
import { createLiveRoomsService } from '../../src/app/live-rooms.js';
const deck={activity:'conversation-deck',version:1,seriesId:'trust',cardIds:['trust-worry','trust-prayer'],activeCardId:'trust-worry'};
function fixture(){
  let uid='host',tenant='church',role='leader',listener,publish=0,handler;
  let row={id:'room',congregation_id:'church',created_by:'host',session_type:'live-room',title:'Session',room_code:'ABC234',status:'lobby',state:{activity:'conversation-deck'},updated_at:'2026-10-18T00:00:00.000Z'};
  const member=()=>({congregationId:tenant,role,congregation:{name:'Church'}});
  const api={create:async(_id,value)=>(row={...row,...value}),findByCode:async()=>row,loadRoom:async()=>row,joinParticipant:async()=>({}),participants:async()=>({participants:[]}),subscribe:(_id,_tenant,fn)=>{listener=fn;return()=>{}},publishState:async(id,user,scope,value,expected)=>{publish++;assert.equal(id,'room');assert.equal(user,'host');assert.equal(scope,'church');assert.equal(expected,row.updated_at);if(handler)return handler(value);row={...row,state:value,status:'active',updated_at:'2026-10-18T00:00:01.000Z'};return row}};
  const service=createLiveRoomsService({api,session:{getState:()=>({authenticated:true,user:{id:uid},remoteAvailable:true})},congregation:{load:async()=>[member()],getActive:member,get:member,can:()=>role==='leader',assert:()=>assert.equal(role,'leader')},codeFactory:()=> 'ABC234'});
  return{service,get row(){return row},set row(value){row=value},set uid(value){uid=value},set tenant(value){tenant=value},set handler(value){handler=value},get publish(){return publish},event:value=>listener(value)};
}
test('canonical prompts have localized titles and valid Scripture ranges',async()=>{
  assert.equal(CONVERSATION_SERIES.length,3);assert.equal(new Set(CONVERSATION_CARDS.map(c=>c.id)).size,9);
  for(const card of CONVERSATION_CARDS){
    for(const locale of ['en','tl','ceb']){assert.ok(card.title[locale]);assert.ok(card.prompt[locale]);}
    assert.equal(conversationText(card.title,'ilo'),card.title.en);
    const verses=JSON.parse(await readFile(new URL(`../../data/packs/bible/${card.code}.json`,import.meta.url),'utf8'));
    const [,chapter,first,last]=card.reference.match(/(\d+):(\d+)–(\d+)$/);
    assert.equal(Number(chapter),card.chapter);
    for(let verse=Number(first);verse<=Number(last);verse++)assert.ok(verses.some(v=>v.c===card.chapter&&v.v===verse),card.reference);
  }
});
test('deck accepts public canonical IDs only and discards private fields',()=>{
  assert.deepEqual(normalizeConversationDeck({...deck,answers:['private'],prompt:'untrusted'}),deck);
  for(const value of [{...deck,version:2},{...deck,cardIds:[]},{...deck,cardIds:['trust-worry','trust-worry']},{...deck,cardIds:['follow-love']},{...deck,activeCardId:'unknown'},{...deck,seriesId:'unknown'},null])assert.equal(normalizeConversationDeck(value),null);
});
test('host explicitly publishes canonical state; late join reads authoritative card',async()=>{
  const f=fixture();await f.service.create({congregationId:'church',activity:'conversation-deck'});assert.equal(f.publish,0);
  await f.service.publishDeck({...deck,notes:'private'});assert.deepEqual(f.row.state,deck);assert.equal(f.publish,1);
  f.service.leave();f.uid='member';await f.service.join('ABC234');assert.deepEqual(f.service.snapshot().room.state,deck);
  await assert.rejects(()=>f.service.publishDeck(deck),e=>e.code==='BQ_LIVE_ROOMS_PERMISSION');assert.equal(f.publish,1);
});
test('invalid deck and optimistic conflict fail without replacing shared state',async()=>{
  const f=fixture();await f.service.join('ABC234');await assert.rejects(()=>f.service.publishDeck({...deck,activeCardId:'unknown'}),e=>e.code==='BQ_LIVE_ROOMS_DECK');assert.equal(f.publish,0);
  f.handler=async()=>null;await assert.rejects(()=>f.service.publishDeck(deck),e=>e.code==='BQ_LIVE_ROOMS_CONFLICT');assert.equal(f.service.snapshot().room.status,'lobby');
});
test('late publish after account/tenant switch cannot expose the old room',async()=>{
  for(const key of ['uid','tenant']){const f=fixture();await f.service.join('ABC234');let resolve;f.handler=()=>new Promise(done=>{resolve=done});const pending=f.service.publishDeck(deck);await new Promise(done=>setImmediate(done));f[key]='other';resolve({...f.row,state:deck,status:'active'});await assert.rejects(()=>pending,e=>e.code==='BQ_LIVE_ROOMS_CONTEXT_STALE');assert.equal(f.service.snapshot().room,null);}
});
test('duplicate sends are rejected, old realtime state ignored, ended refresh clears',async()=>{
  const f=fixture();await f.service.join('ABC234');let resolve;f.handler=()=>new Promise(done=>{resolve=done});const pending=f.service.publishDeck(deck);await new Promise(done=>setImmediate(done));await assert.rejects(()=>f.service.publishDeck(deck),e=>e.code==='BQ_LIVE_ROOMS_BUSY');resolve({...f.row,state:deck,status:'active',updated_at:'2026-10-18T00:00:05.000Z'});await pending;
  f.event({type:'room',room:{...f.row,state:{activity:'lobby'}}});assert.equal(f.service.snapshot().room.state.activeCardId,'trust-worry');
  f.row={...f.row,status:'ended'};await f.service.refresh();assert.equal(f.service.snapshot().room,null);
});

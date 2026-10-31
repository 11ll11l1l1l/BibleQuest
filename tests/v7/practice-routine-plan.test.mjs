import test from 'node:test';
import assert from 'node:assert/strict';
import {REMINDER_ROUTINES, practiceRoutineRoute, reminderRoutineTitle} from '../../src/features/spiritual-practices/routine-catalog.js';
import {PRACTICES, SILENCIO_PRESETS, MORNING_PRESETS, getPractice} from '../../src/features/spiritual-practices/content.js';
import {createPracticeReminders} from '../../src/features/spiritual-practices/reminders.js';
import {homePage} from '../../src/features/home/index.js';
import {localization} from '../../src/app/localization.js';

test('small reminder catalog matches every supported timed template and rejects untrusted route targets',()=>{
  assert.deepEqual(REMINDER_ROUTINES.map(row=>row.id).sort(),[...PRACTICES,...SILENCIO_PRESETS,...MORNING_PRESETS].map(row=>row.id).sort());
  for(const row of REMINDER_ROUTINES){
    assert.equal(getPractice(row.id).title,row.title);
    assert.equal(practiceRoutineRoute(row.id),`spiritual-practices?practice=${row.id}`);
    for(const locale of ['en','tl','ceb'])assert.ok(reminderRoutineTitle(row.id,locale));
  }
  for(const id of [undefined,'__proto__','silencio-custom','https://evil.test','morning-10&note=private'])assert.equal(practiceRoutineRoute(id),'spiritual-practices');
});
function fixture(locale='en'){
  const previous={localStorage:globalThis.localStorage,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
  const local=new Map(),privateValues=new Map(),listeners=new Map(),opened=[];
  globalThis.localStorage={getItem:key=>local.get(key)??null,setItem:(key,value)=>local.set(key,value)};
  localization.setLocale(locale);
  let tick,cleared=false,owner='guest',failStatus=false;
  globalThis.setInterval=fn=>{tick=fn;return 77;};globalThis.clearInterval=id=>{cleared=id===77;};
  const service=createPracticeReminders({storage:{read:key=>privateValues.get(key),write:(key,value)=>privateValues.set(key,value)},getOwner:()=>owner,clock:()=>new Date('2026-11-01T00:00:00Z'),defaultZone:'Asia/Tokyo'});
  service.save({enabled:true,time:'08:00',timeZone:'Asia/Tokyo',days:[0],practiceId:'morning-20'});
  let markup='';const host={get innerHTML(){return markup;},set innerHTML(value){markup=value;},set textContent(value){markup=value;}};
  const root={querySelector:selector=>selector==='[data-home-practice-reminder]'?host:null,querySelectorAll:()=>[],contains:()=>true,
    addEventListener:(name,fn)=>listeners.set(name,[...(listeners.get(name)||[]),fn]),removeEventListener:(name,fn)=>listeners.set(name,(listeners.get(name)||[]).filter(old=>old!==fn))};
  const dispose=homePage({practiceReminders:{...service,status:()=>{if(failStatus)throw new Error('unavailable');return service.status();}},onPractices:id=>opened.push(id)}).mount(root);
  return {host,service,opened,fail:value=>{failStatus=value;},tick:()=>tick(),owner:value=>{owner=value;},click:selector=>{const target={closest:value=>value===selector?target:null};for(const fn of listeners.get('click')||[])fn({target});},
    close(){dispose();assert.equal(cleared,true);globalThis.localStorage=previous.localStorage;globalThis.setInterval=previous.setInterval;globalThis.clearInterval=previous.clearInterval;}};
}
test('actual Home due control opens the chosen canonical setup without dismissing or starting a timer',()=>{
  const f=fixture();
  try{
    assert.match(f.host.innerHTML,/Morning surrender · 20 minutes/);
    f.click('[data-open-due-practice]');assert.deepEqual(f.opened,['morning-20']);
    assert.equal(f.service.status().due,true,'opening setup is not a completion or dismissal');
    f.click('[data-dismiss-practice-reminder]');assert.equal(f.service.status().due,false);
    assert.doesNotMatch(f.host.innerHTML,/data-open-due-practice/);
  }finally{f.close();}
});
test('Home refreshes changed routines and rejects a due control from a stale account',()=>{
  const f=fixture();
  try{
    f.service.save({enabled:true,time:'08:00',timeZone:'Asia/Tokyo',days:[0],practiceId:'evening-5'});f.tick();
    assert.match(f.host.innerHTML,/Evening reflection/);
    f.owner('account:bob');
    f.service.save({enabled:true,time:'08:00',timeZone:'Asia/Tokyo',days:[0],practiceId:'presence-30'});
    f.click('[data-open-due-practice]');assert.deepEqual(f.opened,[]);
    assert.match(f.host.innerHTML,/Daytime pause/);
    f.click('[data-open-due-practice]');assert.deepEqual(f.opened,['presence-30']);
  }finally{f.close();}
});
test('chosen routine title on Home is localized through the current app locale',()=>{
  for(const [locale,label]of [['tl','Pagsuko sa Diyos sa umaga'],['ceb','Pagtugyan sa Diyos sa buntag']]){
    const f=fixture(locale);try{assert.ok(f.host.innerHTML.includes(label));f.click('[data-open-due-practice]');assert.deepEqual(f.opened,['morning-20']);}finally{f.close();}
  }
});

test('Home restores the same due reminder after a transient storage/status error',()=>{
  const f=fixture();try{f.fail(true);f.tick();assert.match(f.host.innerHTML,/unavailable/);f.fail(false);f.tick();assert.match(f.host.innerHTML,/data-open-due-practice/);}finally{f.close();}
});

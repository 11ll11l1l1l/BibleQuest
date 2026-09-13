import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

function harness({windows=[]}={}){
  const handlers=new Map(),shown=[],opened=[],deleted=[],focused=[],navigated=[];
  const clientsList=windows.map((url,index)=>({
    url,
    async navigate(target){this.url=target;navigated.push({index,target});return this;},
    async focus(){focused.push(index);return this;}
  }));
  const context={
    URL,
    Promise,
    Object,
    String,
    caches:{
      async keys(){return ['old-cache','biblequest-clean-shell'];},
      async delete(key){deleted.push(key);return true;},
      async match(){return null;}
    },
    fetch:async req=>({req}),
    self:{
      location:{origin:'https://biblequest.test'},
      registration:{
        scope:'https://biblequest.test/',
        async showNotification(title,options){shown.push({title,options});}
      },
      clients:{
        async claim(){},
        async matchAll(){return clientsList;},
        async openWindow(url){opened.push(url);return {url};}
      },
      skipWaiting(){},
      addEventListener(type,handler){handlers.set(type,handler);}
    }
  };
  vm.runInNewContext(source,context,{filename:'sw.js'});
  async function dispatch(type,event={}){
    const waits=[];
    event.waitUntil=value=>waits.push(Promise.resolve(value));
    handlers.get(type)(event);
    await Promise.all(waits);
    return event;
  }
  return {dispatch,shown,opened,deleted,focused,navigated,handlers};
}

test('push displays a sanitized notification and preserves only routing metadata',async()=>{
  const h=harness();
  await h.dispatch('push',{data:{json:()=>({
    title:'  New Assignment  ',
    body:'Read John 3',
    notification_id:'n-42',
    notification_type:'Assignment',
    url:'/?route=assignments&id=n-42',
    icon:'/assets/v4/notification-assignment.png',
    secret:'must-not-copy'
  })}});
  assert.equal(h.shown.length,1);
  const {title,options}=h.shown[0];
  assert.equal(title,'New Assignment');
  assert.equal(options.body,'Read John 3');
  assert.equal(options.tag,'biblequest-n-42');
  assert.equal(options.data.notificationId,'n-42');
  assert.equal(options.data.type,'assignment');
  assert.equal(options.data.url,'https://biblequest.test/?route=assignments&id=n-42');
  assert.equal(options.secret,undefined);
  assert.equal(options.data.secret,undefined);
});

test('push rejects cross-origin click and icon targets',async()=>{
  const h=harness();
  await h.dispatch('push',{data:{json:()=>({title:'Award',url:'https://evil.example/phish',icon:'https://evil.example/x.png'})}});
  assert.equal(h.shown[0].options.data.url,'https://biblequest.test/');
  assert.equal(h.shown[0].options.icon,undefined);
});

test('malformed push payload still produces a generic notification',async()=>{
  const h=harness();
  await h.dispatch('push',{data:{json:()=>{throw new Error('bad json');}}});
  assert.equal(h.shown[0].title,'BibleQuest');
  assert.equal(h.shown[0].options.data.url,'https://biblequest.test/');
});

test('notification click reuses, navigates and focuses an existing BibleQuest window',async()=>{
  const h=harness({windows:['https://biblequest.test/reader']});
  let closed=false;
  await h.dispatch('notificationclick',{notification:{data:{url:'https://biblequest.test/?route=assignments&id=n-42'},close(){closed=true;}}});
  assert.equal(closed,true);
  assert.deepEqual(h.navigated,[{index:0,target:'https://biblequest.test/?route=assignments&id=n-42'}]);
  assert.deepEqual(h.focused,[0]);
  assert.deepEqual(h.opened,[]);
});

test('notification click opens a new window when BibleQuest is closed',async()=>{
  const h=harness();
  await h.dispatch('notificationclick',{notification:{data:{url:'/?route=recognition'},close(){}}});
  assert.deepEqual(h.opened,['https://biblequest.test/?route=recognition']);
});

test('existing retirement cache behavior remains intact',async()=>{
  const h=harness();
  await h.dispatch('activate',{});
  assert.deepEqual(h.deleted,['old-cache']);
});

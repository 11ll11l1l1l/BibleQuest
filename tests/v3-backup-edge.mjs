import { storage, authStorage } from '../src/core/storage.js';
import { createBackupService } from '../src/app/backup.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
class FakeStorage{
  constructor(){this.map=new Map();this.failOnceKey=''}
  get length(){return this.map.size}
  key(index){return [...this.map.keys()][index]??null}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){if(this.failOnceKey===key){this.failOnceKey='';throw new Error('simulated quota failure')}this.map.set(String(key),String(value))}
  removeItem(key){this.map.delete(String(key))}
}

const local=new FakeStorage();globalThis.localStorage=local;
const backup=createBackupService({storage,clock:()=>new Date('2026-09-08T12:00:00.000Z')});

storage.write('progress-state',{xp:10,counters:{chaptersRead:1}});
storage.write('reader-state',{translation:'bsb',book:'GEN',chapter:1});
storage.write('device-id','11111111-1111-4111-8111-111111111111');
authStorage.setItem('supabase.session','secret-session');
local.setItem('other.site.preference','keep-me');
const exported=backup.exportBackup();
assert(exported.payload.format==='biblequest-v3-local-backup'&&exported.payload.version===1,'Backup format/version is wrong.');
assert(exported.payload.exportedAt==='2026-09-08T12:00:00.000Z','Backup timestamp is wrong.');
assert(exported.count===2,'Only portable local-state entries should be exported.');
assert(exported.payload.entries.some(entry=>entry.name==='progress-state'&&entry.value.xp===10),'Progress state was not exported.');
assert(exported.payload.entries.some(entry=>entry.name==='reader-state'&&entry.value.book==='GEN'),'Reader state was not exported.');
assert(!exported.text.includes('device-id')&&!exported.text.includes('secret-session'),'Device identity/auth data leaked into backup.');

const reset=backup.resetLocalState();
assert(reset.removed===2,'Reset count is wrong.');
assert(storage.read('progress-state',null)===null&&storage.read('reader-state',null)===null,'Reset did not remove portable state.');
assert(storage.read('device-id','')==='11111111-1111-4111-8111-111111111111','Reset removed device identity.');
assert(authStorage.getItem('supabase.session')==='secret-session','Reset removed authentication state.');
assert(local.getItem('other.site.preference')==='keep-me','Reset touched unrelated browser storage.');

const restored=backup.importBackup(exported.text);
assert(restored.count===2,'Import count is wrong.');
assert(storage.read('progress-state').xp===10&&storage.read('reader-state').book==='GEN','Export → reset → import did not restore exact portable state.');
assert(storage.read('device-id','')==='11111111-1111-4111-8111-111111111111'&&authStorage.getItem('supabase.session')==='secret-session','Import changed preserved device/auth state.');

const beforeInvalid=JSON.stringify(storage.exportPortableEntries());
for(const payload of[
  '{not json',
  JSON.stringify({format:'wrong',version:1,entries:[]}),
  JSON.stringify({format:'biblequest-v3-local-backup',version:2,entries:[]}),
  JSON.stringify({format:'biblequest-v3-local-backup',version:1,entries:[{name:'auth.bad',value:'x'}]}),
  JSON.stringify({format:'biblequest-v3-local-backup',version:1,entries:[{name:'progress-state',value:{}},{name:'progress-state',value:{}}]})
]){
  let error='';try{backup.importBackup(payload)}catch(cause){error=cause.message}
  assert(error,'Invalid backup must fail clearly.');
  assert(JSON.stringify(storage.exportPortableEntries())===beforeInvalid,'Invalid backup mutated existing local state.');
}

storage.write('progress-state',{xp:42});storage.write('reader-state',{book:'JHN',chapter:3});
const beforeFailure=JSON.stringify(storage.exportPortableEntries());
local.failOnceKey='biblequest.v3.reader-state';
let replacementError='';
try{backup.importBackup(JSON.stringify({format:'biblequest-v3-local-backup',version:1,exportedAt:'2026-09-08T00:00:00Z',entries:[{name:'progress-state',value:{xp:99}},{name:'reader-state',value:{book:'EXO',chapter:1}}]}))}catch(error){replacementError=error.message}
assert(/could not be replaced/i.test(replacementError),'Storage replacement failure must surface as a controlled error.');
assert(JSON.stringify(storage.exportPortableEntries())===beforeFailure,'Failed import did not roll back the previous portable snapshot.');
assert(storage.read('device-id','')==='11111111-1111-4111-8111-111111111111'&&authStorage.getItem('supabase.session')==='secret-session'&&local.getItem('other.site.preference')==='keep-me','Rollback disturbed excluded storage.');

console.log('BibleQuest v3 Backup/export/import/reset edge regression passed.');

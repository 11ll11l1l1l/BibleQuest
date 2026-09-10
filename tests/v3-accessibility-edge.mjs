import { createAccessibilityService } from '../src/app/accessibility.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const values=new Map([['accessibility-settings',{text:'unsupported',motion:'reduce',contrast:'strong'}]]);
const writes=[];
const storage={
  read(name,fallback){return values.has(name)?values.get(name):fallback},
  write(name,value){const copy=JSON.parse(JSON.stringify(value));values.set(name,copy);writes.push([name,copy]);return value}
};
const motionListeners=new Set();
const mediaQuery={
  matches:false,
  addEventListener(type,listener){if(type==='change')motionListeners.add(listener)},
  removeEventListener(type,listener){if(type==='change')motionListeners.delete(listener)}
};
const accessibility=createAccessibilityService({storage,mediaQuery});
let state=accessibility.getState();
assert(state.text==='normal','Malformed stored text option must normalize to normal.');
assert(state.motion==='reduce'&&state.reducedMotion===true,'Stored reduce-motion preference must be effective immediately.');
assert(state.contrast==='strong','Valid stored contrast option was not retained.');

const seen=[];
const unsubscribe=accessibility.subscribe(value=>seen.push(value));
accessibility.setText('xlarge');
state=accessibility.getState();
assert(state.text==='xlarge','Extra-large text preference was not applied.');
assert(writes.at(-1)?.[0]==='accessibility-settings','Accessibility preference did not use the shared storage key.');
let rejected=false;
try{accessibility.setContrast('impossible')}catch{rejected=true}
assert(rejected,'Unsupported contrast option must be rejected instead of persisted.');

accessibility.setMotion('system');
assert(accessibility.getState().effectiveMotion==='full','System motion should be full while the device does not request reduced motion.');
mediaQuery.matches=true;
for(const listener of motionListeners)listener({matches:true});
assert(accessibility.getState().effectiveMotion==='reduce','System motion did not follow a live reduced-motion device change.');
accessibility.setMotion('full');
assert(accessibility.getState().effectiveMotion==='full','Explicit full motion must not be converted to reduced motion by the service.');
accessibility.reset();
state=accessibility.getState();
assert(state.text==='normal'&&state.motion==='system'&&state.contrast==='normal','Accessibility reset did not restore defaults.');
assert(state.effectiveMotion==='reduce','Reset system motion must still follow the current device preference.');
assert(seen.length>=5,'Accessibility subscribers did not receive preference/effective-motion updates.');
unsubscribe();
accessibility.dispose();
assert(motionListeners.size===0,'Accessibility service did not clean up the device motion listener.');
let disposedRejected=false;
try{accessibility.setText('large')}catch{disposedRejected=true}
assert(disposedRejected,'Disposed Accessibility service must reject later mutations.');
console.log('BibleQuest v3 Accessibility preference edge regression passed.');

import { createMediaLibraryService } from '../src/app/media-library.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const calls=[];
let mode='ready';
const rows=[
  {id:'one',title:'Sunday Worship',description:'Worship replay',featured:true,youtubeId:'abcDEF12345'},
  {id:'two',title:'Wednesday Bible Study',description:'Study replay',featured:false,youtubeId:'ZyxWV987654'}
];
const recordings={
  async load(){calls.push(['load']);if(mode==='locked')return{status:'locked',rows:[],access:'signin'};if(mode==='error')return{status:'error',rows:[],access:'granted',error:'simulated media failure'};return{status:'ready',rows,access:'granted'}},
  select(id){calls.push(['select',id])},play(){calls.push(['play'])},pause(){calls.push(['pause'])},stop(){calls.push(['stop'])},seek(value){calls.push(['seek',Number(value)])},leave(){calls.push(['leave'])},getPlayerCount(){return calls.some(row=>row[0]==='select')?1:0}
};
const library=createMediaLibraryService({recordings});
let state=await library.load();
assert(state.status==='ready'&&state.rows.length===2,'Media Library failed to load verified recordings data.');
assert(Object.isFrozen(state)&&Object.isFrozen(state.rows)&&Object.isFrozen(state.rows[0]),'Media Library snapshots must be immutable.');
assert(library.visibleRows().length===2,'All media view should expose both rows.');
state=library.setView('featured');assert(library.visibleRows(state).length===1&&library.visibleRows(state)[0].id==='one','Featured filter failed.');
state=library.setView('all');state=library.setQuery('bible study');assert(library.visibleRows(state).length===1&&library.visibleRows(state)[0].id==='two','Media search failed.');
state=library.setQuery('');library.open('one',{});assert(library.getState().selectedId==='one'&&library.selected()?.title==='Sunday Worship','Media open/selection failed.');
library.play();library.pause();library.seek(30);library.stop();
assert(calls.some(row=>row[0]==='play')&&calls.some(row=>row[0]==='pause')&&calls.some(row=>row[0]==='seek'&&row[1]===30)&&calls.some(row=>row[0]==='stop'),'Media Library controls must delegate to Recordings/Audio ownership.');
library.returnToBrowse();assert(library.getState().selectedId===null&&calls.at(-1)[0]==='leave','Back-to-library must tear down playback.');
let invalid='';try{library.setView('unknown')}catch(error){invalid=error.message}assert(/unknown media library view/i.test(invalid),'Unknown Media Library view must fail safely.');
let missing='';try{library.open('missing',{})}catch(error){missing=error.message}assert(/no longer available/i.test(missing),'Opening stale media must fail safely.');
mode='locked';state=await library.load();assert(state.status==='locked'&&state.access==='signin','Media Library must preserve guest/account lock state from the owning recordings boundary.');
mode='error';state=await library.load();assert(state.status==='error'&&/simulated/i.test(state.error),'Media Library must preserve recoverable data failure state.');
library.leave();assert(library.getState().status==='idle'&&library.getState().rows.length===0,'Leaving Media Library must reset route-local browsing state.');
console.log('BibleQuest v3 Media Library edge regression passed.');

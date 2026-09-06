import { createRecordingsService } from '../src/app/recordings.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const calls=[];
const audio={
  state:{status:'idle'},
  unload(){calls.push(['unload']);this.state={status:'idle'}},
  mount(host,source){calls.push(['mount',source.id]);this.state={status:'ready',source};return this.state},
  play(){calls.push(['play']);this.state={...this.state,status:'playing'}},
  pause(){calls.push(['pause']);this.state={...this.state,status:'paused'}},
  stop(){calls.push(['stop']);this.state={...this.state,status:'stopped'}},
  seek(value){calls.push(['seek',Number(value)]);this.state={...this.state,position:Number(value)}},
  dispose(){calls.push(['dispose']);this.state={status:'idle'}},
  getState(){return this.state},
  getPlayerCount(){return this.state.source?1:0}
};
let authenticated=false,mediaCalls=0,fail=false;
const session={isAuthenticated:()=>authenticated};
const media={async listLiveRecordings(){mediaCalls++;if(fail)throw new Error('simulated recordings failure');return[
  {id:'one',youtube_id:'abcDEF12345',title:'Sunday Worship',description:'Replay',featured:true},
  {id:'bad',youtube_id:'bad!',title:'Invalid source'},
  {id:'two',youtube_id:'ZyxWV987654',title:'Bible Study'}
]}};
const recordings=createRecordingsService({media,audio,session});

let state=await recordings.load();
assert(state.status==='locked'&&state.access==='signin','Guest recordings must be locked.');
assert(mediaCalls===0,'Guest recordings load must not contact cloud media.');

authenticated=true;state=await recordings.load();
assert(state.status==='ready'&&state.rows.length===2,'Authenticated recordings load must keep only valid rows.');
assert(state.rows[0].title==='Sunday Worship'&&Object.isFrozen(state.rows),'Recordings snapshots must be immutable.');
recordings.select('one',{});assert(recordings.getState().selectedId==='one','Recording selection failed.');
recordings.play();recordings.pause();recordings.seek(45);recordings.stop();
assert(calls.some(row=>row[0]==='play')&&calls.some(row=>row[0]==='pause')&&calls.some(row=>row[0]==='seek'&&row[1]===45)&&calls.some(row=>row[0]==='stop'),'Playback controls did not delegate to the single audio owner.');
recordings.select('two',{});assert(recordings.getState().selectedId==='two','Recording source switch failed.');
assert(calls.filter(row=>row[0]==='mount').map(row=>row[1]).join(',')==='abcDEF12345,ZyxWV987654','Source switching must pass through one audio mount owner.');
recordings.leave();assert(recordings.getState().selectedId===null&&calls.at(-1)[0]==='unload','Leaving recordings must tear playback down.');
let noSelection='';try{recordings.play()}catch(error){noSelection=error.message}assert(/choose a recording/i.test(noSelection),'Playback without selection must fail safely.');
fail=true;state=await recordings.load();assert(state.status==='error'&&/simulated/i.test(state.error),'Recordings data failure must become a recoverable error state.');
recordings.dispose();assert(calls.at(-1)[0]==='dispose','Recordings disposal must dispose the audio owner.');
console.log('BibleQuest v3 recordings lifecycle edge regression passed.');

import { GAME_MODES, buildGameRound } from '../features/games/content.js';

const XP = Object.freeze({ correct:10, incorrect:3 });
const RESULTS_KEY = 'games-results';
const modeById = id => GAME_MODES.find(mode => mode.id === id) || null;
const freezeQuestion = question => question ? Object.freeze({...question, choices:Object.freeze([...question.choices])}) : null;
const freezeResult = result => result ? Object.freeze({...result}) : null;

function normalizeResults(input){
  const results={};
  if(!input || typeof input!=='object' || Array.isArray(input)) return results;
  for(const mode of GAME_MODES){
    const row=input[mode.id];
    if(!row || typeof row!=='object') continue;
    const score=Number(row.score),total=Number(row.total),gained=Number(row.gained);
    if(!Number.isSafeInteger(score)||score<0||!Number.isSafeInteger(total)||total<1||score>total||!Number.isSafeInteger(gained)||gained<0) continue;
    results[mode.id]={score,total,gained,completedAt:typeof row.completedAt==='string'?row.completedAt:''};
  }
  return results;
}

export function createGameLauncherService({progress,storage,roundIdFactory,clock=()=>new Date()} = {}){
  if(!progress || !storage) throw new Error('Game launcher requires the verified Progress and Storage owners.');
  let sequence=0;
  const bootNonce=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const makeRoundId=typeof roundIdFactory==='function'
    ? roundIdFactory
    : (mode,roundSequence)=>`${bootNonce}-${mode}-${roundSequence}`;
  let results=normalizeResults(storage.read(RESULTS_KEY,{}));

  let state={phase:'launcher',mode:null,roundId:null,bank:[],index:0,score:0,gained:0,locked:false,selected:null,correct:null};

  const snapshot=()=>{
    const mode=state.mode?modeById(state.mode):null;
    const question=state.phase==='question'?state.bank[state.index]||null:null;
    return Object.freeze({
      phase:state.phase,
      mode:state.mode,
      modeTitle:mode?.title||'',
      roundId:state.roundId,
      index:state.index,
      total:state.bank.length,
      score:state.score,
      gained:state.gained,
      locked:state.locked,
      selected:state.selected,
      correct:state.correct,
      question:freezeQuestion(question),
      lastResult:freezeResult(state.mode?results[state.mode]:null)
    });
  };

  function start(mode){
    if(!modeById(mode)) throw new Error('Unknown BibleQuest game mode.');
    const bank=[...buildGameRound(mode)];
    if(!bank.length) throw new Error('This BibleQuest game has no verified questions.');
    sequence+=1;
    const roundId=String(makeRoundId(mode,sequence)||'').trim();
    if(!roundId || roundId.length>100) throw new Error('Game round identity is invalid.');
    state={phase:'question',mode,roundId,bank,index:0,score:0,gained:0,locked:false,selected:null,correct:null};
    return snapshot();
  }

  function answer(choiceIndex){
    if(state.phase!=='question') throw new Error('Start a BibleQuest game before answering.');
    if(state.locked) return Object.freeze({applied:false,duplicate:true,...snapshot()});
    const question=state.bank[state.index];
    const choice=Number(choiceIndex);
    if(!Number.isInteger(choice)||choice<0||choice>=question.choices.length) throw new Error('Choose one of the available answers.');
    const correct=choice===question.answer;
    const xp=correct?XP.correct:XP.incorrect;
    progress.record({
      id:`game:${state.roundId}:question:${question.id}`,
      type:'game.question',
      xp,
      meaningful:false,
      metrics:correct?{quizCorrect:1}:{}
    });
    state={...state,score:state.score+(correct?1:0),gained:state.gained+xp,locked:true,selected:choice,correct};
    return Object.freeze({applied:true,duplicate:false,...snapshot()});
  }

  function saveResult(){
    const rawTime=clock();
    const completedAt=rawTime instanceof Date?rawTime:new Date(rawTime);
    if(!Number.isFinite(completedAt.getTime())) throw new Error('Game completion time is invalid.');
    const result={score:state.score,total:state.bank.length,gained:state.gained,completedAt:completedAt.toISOString()};
    results={...results,[state.mode]:result};
    storage.write(RESULTS_KEY,results);
    return result;
  }

  function next(){
    if(state.phase!=='question') throw new Error('There is no active BibleQuest question.');
    if(!state.locked) throw new Error('Answer the current question before continuing.');
    const isLast=state.index+1>=state.bank.length;
    if(isLast){
      progress.record({id:`game:${state.roundId}:complete`,type:'game.round.complete',xp:0,meaningful:true});
      saveResult();
      state={...state,phase:'complete',index:state.bank.length,locked:false,selected:null,correct:null};
      return snapshot();
    }
    state={...state,index:state.index+1,locked:false,selected:null,correct:null};
    return snapshot();
  }

  function replay(){
    if(!state.mode) throw new Error('Choose a BibleQuest game before replaying.');
    return start(state.mode);
  }

  function showLauncher(){
    state={phase:'launcher',mode:null,roundId:null,bank:[],index:0,score:0,gained:0,locked:false,selected:null,correct:null};
    return snapshot();
  }

  function lastResult(mode){
    if(!modeById(mode)) throw new Error('Unknown BibleQuest game mode.');
    return freezeResult(results[mode]||null);
  }

  function leave(){ return showLauncher(); }

  return Object.freeze({
    getState:snapshot,
    modes:Object.freeze(GAME_MODES.map(mode=>Object.freeze({...mode}))),
    start,
    answer,
    next,
    replay,
    showLauncher,
    lastResult,
    leave,
    xp:XP
  });
}

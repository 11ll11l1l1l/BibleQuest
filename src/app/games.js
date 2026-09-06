import { GAME_MODES, buildGameRound } from '../features/games/content.js';

const XP = Object.freeze({ correct:10, incorrect:3 });
const modeById = id => GAME_MODES.find(mode => mode.id === id) || null;
const freezeQuestion = question => question ? Object.freeze({...question, choices:Object.freeze([...question.choices])}) : null;

export function createGameLauncherService({progress, roundIdFactory} = {}){
  if(!progress) throw new Error('Game launcher requires the verified Progress owner.');
  let sequence=0;
  const bootNonce=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const makeRoundId=typeof roundIdFactory==='function'
    ? roundIdFactory
    : (mode,roundSequence)=>`${bootNonce}-${mode}-${roundSequence}`;

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
      question:freezeQuestion(question)
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

  function next(){
    if(state.phase!=='question') throw new Error('There is no active BibleQuest question.');
    if(!state.locked) throw new Error('Answer the current question before continuing.');
    const isLast=state.index+1>=state.bank.length;
    if(isLast){
      progress.record({id:`game:${state.roundId}:complete`,type:'game.round.complete',xp:0,meaningful:true});
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

  function leave(){ return showLauncher(); }

  return Object.freeze({
    getState:snapshot,
    modes:Object.freeze(GAME_MODES.map(mode=>Object.freeze({...mode}))),
    start,
    answer,
    next,
    replay,
    showLauncher,
    leave,
    xp:XP
  });
}

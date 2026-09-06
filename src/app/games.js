import { GAME_MODES, buildGameRound } from '../features/games/content.js';

const XP=Object.freeze({correct:10,incorrect:3,recallGot:5,recallAgain:1});
const RESULTS_KEY='games-results';
const RECALL_KEY='games-recall';
const modeById=id=>GAME_MODES.find(mode=>mode.id===id)||null;
const freezeQuestion=question=>question?Object.freeze({...question,choices:Object.freeze([...question.choices])}):null;
const freezeResult=result=>result?Object.freeze({...result}):null;
const freezeRecallItem=item=>item?Object.freeze({...item}):null;
const freezeBook=book=>book?Object.freeze({...book}):null;
const validCode=value=>/^[0-9A-Z]{3}$/.test(String(value||''));

function normalizeResults(input){
  const results={};
  if(!input||typeof input!=='object'||Array.isArray(input))return results;
  for(const mode of GAME_MODES){
    const row=input[mode.id];
    if(!row||typeof row!=='object')continue;
    const score=Number(row.score),total=Number(row.total),gained=Number(row.gained);
    if(!Number.isSafeInteger(score)||score<0||!Number.isSafeInteger(total)||total<1||score>total||!Number.isSafeInteger(gained)||gained<0)continue;
    results[mode.id]={score,total,gained,completedAt:typeof row.completedAt==='string'?row.completedAt:''};
  }
  return results;
}

function normalizeRecall(input){
  const value=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const review={},stats={},results={};
  if(value.review&&typeof value.review==='object'&&!Array.isArray(value.review)){
    for(const [code,ids] of Object.entries(value.review))if(validCode(code)&&Array.isArray(ids))review[code]=[...new Set(ids.map(id=>String(id||'').trim()).filter(id=>id&&id.length<=100))].slice(0,5000);
  }
  if(value.stats&&typeof value.stats==='object'&&!Array.isArray(value.stats)){
    for(const [code,row] of Object.entries(value.stats))if(validCode(code)&&row&&typeof row==='object')stats[code]={seen:Math.max(0,Number.isSafeInteger(Number(row.seen))?Number(row.seen):0),got:Math.max(0,Number.isSafeInteger(Number(row.got))?Number(row.got):0),again:Math.max(0,Number.isSafeInteger(Number(row.again))?Number(row.again):0)};
  }
  if(value.results&&typeof value.results==='object'&&!Array.isArray(value.results)){
    for(const [code,row] of Object.entries(value.results)){
      if(!validCode(code)||!row||typeof row!=='object')continue;
      const remembered=Number(row.remembered),total=Number(row.total),reviewAgain=Number(row.reviewAgain),gained=Number(row.gained),remaining=Number(row.remaining);
      if(![remembered,total,reviewAgain,gained,remaining].every(Number.isSafeInteger)||total<1||remembered<0||remembered>total||reviewAgain<0||reviewAgain>total||gained<0||remaining<0)continue;
      results[code]={remembered,total,reviewAgain,gained,remaining,completedAt:typeof row.completedAt==='string'?row.completedAt:''};
    }
  }
  return {version:1,review,stats,results};
}

function emptyState(){return{phase:'launcher',mode:null,roundId:null,bank:[],index:0,score:0,gained:0,locked:false,selected:null,correct:null,recallBooks:[],recallQuery:'',recallBook:null,recallItems:[],revealed:false,remembered:0,reviewAgain:0,source:'',license:''}}

export function createGameLauncherService({progress,storage,recall,roundIdFactory,clock=()=>new Date()}={}){
  if(!progress||!storage||!recall)throw new Error('Game launcher requires verified Progress, Storage, and Recall Pack owners.');
  let sequence=0;
  const bootNonce=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
  const makeRoundId=typeof roundIdFactory==='function'?roundIdFactory:(mode,roundSequence)=>`${bootNonce}-${mode}-${roundSequence}`;
  let results=normalizeResults(storage.read(RESULTS_KEY,{}));
  let recallState=normalizeRecall(storage.read(RECALL_KEY,{}));
  let state=emptyState();

  const snapshot=()=>{
    const mode=state.mode?modeById(state.mode):null;
    const question=state.phase==='question'?state.bank[state.index]||null:null;
    const recallItem=state.phase==='recall-question'?state.recallItems[state.index]||null:null;
    const total=state.phase.startsWith('recall-')&&state.phase!=='recall-library'?state.recallItems.length:state.bank.length;
    const remainingReview=state.recallBook?(recallState.review[state.recallBook.code]||[]).length:0;
    return Object.freeze({phase:state.phase,mode:state.mode,modeTitle:mode?.title||'',roundId:state.roundId,index:state.index,total,score:state.score,gained:state.gained,locked:state.locked,selected:state.selected,correct:state.correct,question:freezeQuestion(question),lastResult:freezeResult(state.mode?results[state.mode]:null),recallBooks:Object.freeze(state.recallBooks.map(freezeBook)),recallQuery:state.recallQuery,recallBook:freezeBook(state.recallBook),recallItem:freezeRecallItem(recallItem),revealed:state.revealed,remembered:state.remembered,reviewAgain:state.reviewAgain,remainingReview,source:state.source,license:state.license});
  };

  function persistRecall(){storage.write(RECALL_KEY,recallState)}
  function validRoundId(mode){sequence+=1;const roundId=String(makeRoundId(mode,sequence)||'').trim();if(!roundId||roundId.length>100)throw new Error('Game round identity is invalid.');return roundId}

  function start(mode){
    const definition=modeById(mode);
    if(!definition)throw new Error('Unknown BibleQuest game mode.');
    if(definition.entry==='recall-library')throw new Error('Open the Per-book Recall library before choosing a book.');
    const bank=[...buildGameRound(mode)];
    if(!bank.length)throw new Error('This BibleQuest game has no verified questions.');
    state={...emptyState(),phase:'question',mode,roundId:validRoundId(mode),bank};
    return snapshot();
  }

  function answer(choiceIndex){
    if(state.phase!=='question')throw new Error('Start a BibleQuest game before answering.');
    if(state.locked)return Object.freeze({applied:false,duplicate:true,...snapshot()});
    const question=state.bank[state.index],choice=Number(choiceIndex);
    if(!Number.isInteger(choice)||choice<0||choice>=question.choices.length)throw new Error('Choose one of the available answers.');
    const correct=choice===question.answer,xp=correct?XP.correct:XP.incorrect;
    progress.record({id:`game:${state.roundId}:question:${question.id}`,type:'game.question',xp,meaningful:false,metrics:correct?{quizCorrect:1}:{}});
    state={...state,score:state.score+(correct?1:0),gained:state.gained+xp,locked:true,selected:choice,correct};
    return Object.freeze({applied:true,duplicate:false,...snapshot()});
  }

  function completionTime(){const raw=clock(),date=raw instanceof Date?raw:new Date(raw);if(!Number.isFinite(date.getTime()))throw new Error('Game completion time is invalid.');return date.toISOString()}
  function saveResult(){const result={score:state.score,total:state.bank.length,gained:state.gained,completedAt:completionTime()};results={...results,[state.mode]:result};storage.write(RESULTS_KEY,results);return result}

  function next(){
    if(state.phase!=='question')throw new Error('There is no active BibleQuest question.');
    if(!state.locked)throw new Error('Answer the current question before continuing.');
    if(state.index+1>=state.bank.length){progress.record({id:`game:${state.roundId}:complete`,type:'game.round.complete',xp:0,meaningful:true});saveResult();state={...state,phase:'complete',index:state.bank.length,locked:false,selected:null,correct:null};return snapshot()}
    state={...state,index:state.index+1,locked:false,selected:null,correct:null};return snapshot();
  }

  function replay(){if(!state.mode)throw new Error('Choose a BibleQuest game before replaying.');return start(state.mode)}

  async function openRecallLibrary(){
    const manifest=await recall.loadManifest();
    state={...emptyState(),phase:'recall-library',mode:'per-book-recall',recallBooks:[...manifest.books],source:manifest.source,license:manifest.license};
    return snapshot();
  }

  function setRecallQuery(query){
    if(state.phase!=='recall-library')throw new Error('Open the Per-book Recall library before searching.');
    state={...state,recallQuery:String(query||'').trim().slice(0,80)};return snapshot();
  }

  function visibleRecallBooks(){
    if(state.phase!=='recall-library')return Object.freeze([]);
    const needle=state.recallQuery.toLocaleLowerCase();
    return Object.freeze(state.recallBooks.filter(book=>!needle||book.name.toLocaleLowerCase().includes(needle)||book.code.toLocaleLowerCase().includes(needle)).map(freezeBook));
  }

  async function startRecallBook(code){
    const loaded=await recall.loadBook(code),reviewIds=new Set(recallState.review[loaded.book.code]||[]);
    const reviewItems=loaded.items.filter(item=>reviewIds.has(item.id)).slice(0,5),reviewSet=new Set(reviewItems.map(item=>item.id));
    const fresh=loaded.items.filter(item=>!reviewIds.has(item.id)&&!reviewSet.has(item.id)).slice(0,Math.max(0,10-reviewItems.length));
    const items=[...reviewItems,...fresh];
    if(!items.length)throw new Error(`${loaded.book.name} has no approved recall questions.`);
    const books=state.recallBooks.length?state.recallBooks:(await recall.loadManifest()).books;
    state={...emptyState(),phase:'recall-question',mode:'per-book-recall',roundId:validRoundId(`per-book-recall-${loaded.book.code}`),recallBooks:[...books],recallBook:loaded.book,recallItems:items,source:loaded.source,license:loaded.license};
    return snapshot();
  }

  function revealRecall(){if(state.phase!=='recall-question')throw new Error('Open a Per-book Recall question first.');if(state.revealed)return snapshot();state={...state,revealed:true};return snapshot()}

  function rateRecall(rating){
    if(state.phase!=='recall-question')throw new Error('Open a Per-book Recall question first.');
    if(!state.revealed)throw new Error('Reveal the reference answer before rating recall.');
    if(!['got','again'].includes(rating))throw new Error('Choose Got it or Review again.');
    const item=state.recallItems[state.index],code=state.recallBook.code,got=rating==='got',xp=got?XP.recallGot:XP.recallAgain;
    progress.record({id:`game:${state.roundId}:recall:${item.id}`,type:'game.recall',xp,meaningful:false,metrics:got?{quizCorrect:1}:{}});
    const current=recallState.review[code]||[],review=got?current.filter(id=>id!==item.id):[...new Set([...current,item.id])];
    const prior=recallState.stats[code]||{seen:0,got:0,again:0},stats={seen:prior.seen+1,got:prior.got+(got?1:0),again:prior.again+(got?0:1)};
    recallState={...recallState,review:{...recallState.review,[code]:review},stats:{...recallState.stats,[code]:stats}};
    persistRecall();
    const remembered=state.remembered+(got?1:0),reviewAgain=state.reviewAgain+(got?0:1),gained=state.gained+xp;
    if(state.index+1>=state.recallItems.length){
      progress.record({id:`game:${state.roundId}:complete`,type:'game.recall.complete',xp:0,meaningful:true});
      const result={remembered,total:state.recallItems.length,reviewAgain,gained,remaining:review.length,completedAt:completionTime()};
      recallState={...recallState,results:{...recallState.results,[code]:result}};persistRecall();
      state={...state,phase:'recall-complete',index:state.recallItems.length,remembered,reviewAgain,gained,revealed:false};
      return snapshot();
    }
    state={...state,index:state.index+1,remembered,reviewAgain,gained,revealed:false};return snapshot();
  }

  function recallSummary(code){
    const normalized=String(code||'').toUpperCase();if(!validCode(normalized))throw new Error('Unknown Per-book Recall book.');
    const stats=recallState.stats[normalized]||{seen:0,got:0,again:0},last=recallState.results[normalized]||null;
    return Object.freeze({review:(recallState.review[normalized]||[]).length,seen:stats.seen,got:stats.got,again:stats.again,last:freezeResult(last)});
  }

  async function returnRecallLibrary(){return openRecallLibrary()}
  async function replayRecall(){if(!state.recallBook)throw new Error('Choose a Per-book Recall book before replaying.');return startRecallBook(state.recallBook.code)}
  function lastResult(mode){if(!modeById(mode))throw new Error('Unknown BibleQuest game mode.');return freezeResult(results[mode]||null)}
  function showLauncher(){state=emptyState();return snapshot()}
  function leave(){return showLauncher()}

  return Object.freeze({getState:snapshot,modes:Object.freeze(GAME_MODES.map(mode=>Object.freeze({...mode}))),start,answer,next,replay,openRecallLibrary,setRecallQuery,visibleRecallBooks,startRecallBook,revealRecall,rateRecall,recallSummary,returnRecallLibrary,replayRecall,showLauncher,lastResult,leave,xp:XP});
}

import { KIDS_MEMORY_DELAYS, KIDS_MEMORY_MODE, buildMemoryDeck, memoryReward } from '../features/games/memory.js';

const freezeCard=card=>Object.freeze({...card});
const emptyState=()=>({phase:'memory-idle',roundId:null,cards:[],flipped:[],moves:0,lock:false,pending:null,columns:3,pairs:6,stars:0,coins:0,totalStars:0,totalCoins:0});

export function createKidsMemoryGame({progress,roundIdFactory,random=Math.random}={}){
  if(!progress?.record||!progress?.getState)throw new Error('Memory Meadow requires the verified Progress owner.');
  if(typeof roundIdFactory!=='function')throw new Error('Memory Meadow requires the Games round identity owner.');
  let state=emptyState(),sequence=0;

  const snapshot=()=>Object.freeze({
    phase:state.phase,
    mode:KIDS_MEMORY_MODE.id,
    modeTitle:KIDS_MEMORY_MODE.title,
    roundId:state.roundId,
    cards:Object.freeze(state.cards.map(freezeCard)),
    flipped:Object.freeze([...state.flipped]),
    moves:state.moves,
    locked:state.lock,
    pending:state.pending?Object.freeze({...state.pending}):null,
    columns:state.columns,
    pairs:state.pairs,
    stars:state.stars,
    coins:state.coins,
    totalStars:state.totalStars,
    totalCoins:state.totalCoins
  });

  const newRoundId=()=>{
    sequence+=1;
    const value=String(roundIdFactory(KIDS_MEMORY_MODE.id,sequence)||'').trim();
    if(!value||value.length>100)throw new Error('Memory Meadow round identity is invalid.');
    return value;
  };

  function start(width){
    const deck=buildMemoryDeck(width,random),balances=progress.getState();
    state={phase:'memory',roundId:newRoundId(),cards:deck.cards.map(card=>({...card})),flipped:[],moves:0,lock:false,pending:null,columns:deck.columns,pairs:deck.pairs,stars:0,coins:0,totalStars:balances.stars||0,totalCoins:balances.coins||0};
    return snapshot();
  }

  function flip(index){
    if(state.phase!=='memory')throw new Error('Start Memory Meadow before flipping a card.');
    if(state.lock)return Object.freeze({applied:false,locked:true,state:snapshot(),pending:state.pending?Object.freeze({...state.pending}):null});
    const cardIndex=Number(index);
    if(!Number.isInteger(cardIndex)||cardIndex<0||cardIndex>=state.cards.length)throw new Error('Memory Meadow card selection is invalid.');
    const selected=state.cards[cardIndex];
    if(selected.open||selected.done)return Object.freeze({applied:false,duplicate:true,state:snapshot(),pending:null});
    const cards=state.cards.map((card,i)=>i===cardIndex?{...card,open:true}:card),flipped=[...state.flipped,cardIndex];
    if(flipped.length===1){state={...state,cards,flipped};return Object.freeze({applied:true,state:snapshot(),pending:null})}
    if(flipped.length!==2)throw new Error('Memory Meadow flip state is invalid.');
    const [first,second]=flipped,moves=state.moves+1,kind=cards[first].icon===cards[second].icon?'match':'mismatch';
    const pending={token:`${state.roundId}:${moves}:${first}:${second}`,kind,delayMs:KIDS_MEMORY_DELAYS[kind],first,second};
    state={...state,cards,flipped,moves,lock:true,pending};
    return Object.freeze({applied:true,state:snapshot(),pending:Object.freeze({...pending})});
  }

  function resolve(token){
    if(state.phase!=='memory'||!state.pending||String(token)!==state.pending.token)return Object.freeze({applied:false,stale:true,state:snapshot()});
    const {kind,first,second}=state.pending;
    let cards=state.cards.map(card=>({...card}));
    if(kind==='match'){
      cards[first]={...cards[first],open:true,done:true};cards[second]={...cards[second],open:true,done:true};
      if(cards.every(card=>card.done)){
        const reward=memoryReward(state.moves);
        const result=progress.record({id:`game:${state.roundId}:memory:complete`,type:'game.memory.complete',xp:0,meaningful:true,rewards:reward});
        state={...state,phase:'memory-complete',cards,flipped:[],lock:false,pending:null,stars:reward.stars,coins:reward.coins,totalStars:result.state.stars,totalCoins:result.state.coins};
        return Object.freeze({applied:true,completed:true,state:snapshot()});
      }
    }else{
      cards[first]={...cards[first],open:false};cards[second]={...cards[second],open:false};
    }
    state={...state,cards,flipped:[],lock:false,pending:null};
    return Object.freeze({applied:true,completed:false,state:snapshot()});
  }

  function replay(width){return start(width)}
  function leave(){state=emptyState();return snapshot()}

  return Object.freeze({mode:KIDS_MEMORY_MODE,start,flip,resolve,replay,leave,getState:snapshot,delays:KIDS_MEMORY_DELAYS});
}

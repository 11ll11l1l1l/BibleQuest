(() => {
  const APP='biblequest_state_v4';
  const COUPLES='biblequest_couples_v1';
  const original=Storage.prototype.setItem;
  let internal=false;

  const parse=v=>{try{return JSON.parse(v||'{}')}catch{return {}}};
  const sumDeck=s=>Object.values(s?.deckStats||{}).reduce((n,x)=>n+(Number(x?.seen)||0),0);
  const sumGot=s=>Object.values(s?.deckStats||{}).reduce((n,x)=>n+(Number(x?.got)||0),0);
  const sumMastery=s=>Object.values(s?.mastery||{}).reduce((n,x)=>n+(Number(x)||0),0);
  const doneCommit=s=>(s?.commitments||[]).filter(x=>x?.done).length;
  const positive=(a,b)=>Math.max(0,(Number(b)||0)-(Number(a)||0));

  function award(points,category,source,meta={}){
    if(internal||!points||!window.BQCommunity?.awardPoints)return;
    internal=true;
    try{window.BQCommunity.awardPoints(window.BQCommunity.profileName(),points,category,source,meta)}finally{internal=false}
  }

  function appDelta(before,after){
    const deckBefore=sumDeck(before),deckAfter=sumDeck(after),deckDelta=positive(deckBefore,deckAfter);
    const gotDelta=positive(sumGot(before),sumGot(after));
    const situationDelta=positive(before.situations,after.situations);
    const masteryDelta=positive(sumMastery(before),sumMastery(after));
    const streakDelta=positive(before.streak,after.streak);
    const answeredDelta=positive(before.answered,after.answered);
    const correctDelta=positive(before.correct,after.correct);

    // Recall decks are reading/recall activities; don't also count their answer as generic quiz points.
    if(deckDelta)award(deckDelta*4+gotDelta*2,'reading','Recall Deck',{cards:deckDelta,remembered:gotDelta});
    if(situationDelta)award(situationDelta*5,'wisdom','Situations & Wisdom',{completed:situationDelta});
    if(masteryDelta)award(Math.max(1,Math.round(masteryDelta/2)),'mastery','Journey Mastery',{growth:masteryDelta});
    if(streakDelta)award(3,'consistency','Learning Streak',{days:after.streak||1});

    const genericAnswered=Math.max(0,answeredDelta-deckDelta);
    const genericCorrect=Math.max(0,correctDelta-gotDelta);
    if(genericAnswered){
      const incorrect=Math.max(0,genericAnswered-genericCorrect);
      if(genericCorrect)award(genericCorrect*8,'knowledge','Solo Bible Game',{correct:genericCorrect});
      if(incorrect)award(incorrect*2,'knowledge','Learning Attempt',{attempts:incorrect});
    }
  }

  function couplesDelta(before,after){
    const history=positive((before.history||[]).length,(after.history||[]).length);
    const listen=positive(before.listenCount,after.listenCount);
    const checkins=positive((before.checkins||[]).length,(after.checkins||[]).length);
    const commitments=positive(doneCommit(before),doneCommit(after));
    if(history)award(history*4,'couples','Couples Conversation',{completed:history});
    if(listen)award(listen*5,'couples','Listen First',{completed:listen});
    if(checkins)award(checkins*4,'couples','Couple Check-in',{completed:checkins});
    if(commitments)award(commitments*6,'couples','Couples Practice',{completed:commitments});
  }

  Storage.prototype.setItem=function(key,value){
    if(internal)return original.call(this,key,value);
    const watch=key===APP||key===COUPLES;
    const before=watch?parse(this.getItem(key)):null;
    const out=original.call(this,key,value);
    if(watch){
      const after=parse(value);
      queueMicrotask(()=>{
        try{key===APP?appDelta(before,after):couplesDelta(before,after)}catch(err){console.warn('BibleQuest community bridge:',err)}
      });
    }
    return out;
  };

  window.BQCommunityBridge={appDelta,couplesDelta};
})();
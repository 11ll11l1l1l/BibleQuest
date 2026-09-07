import { GUIDED_STUDIES, getGuidedStudy } from '../features/study/content.js';

const freezeLibraryItem=study=>Object.freeze({id:study.id,title:study.title,kicker:study.kicker,description:study.description,duration:study.duration,passage:Object.freeze({...study.passage})});

export function createGuidedStudyService({lesson,progress,reader}){
  if(!lesson||!progress||!reader)throw new Error('Guided Study requires Lesson, Progress, and Reader owners.');
  let activeStudy=null;

  const requireOpen=()=>{
    if(!activeStudy)throw new Error('Open a Guided Study before using it.');
    return activeStudy;
  };

  const decorate=state=>{
    const study=requireOpen();
    const percent=state.status==='complete'?100:Math.max(0,Math.min(99,Math.round((state.index/Math.max(1,state.totalSteps))*100)));
    return Object.freeze({
      study:freezeLibraryItem(study),
      percent,
      state
    });
  };

  const reconcile=state=>{
    const study=requireOpen();
    if(state.status==='complete'){
      progress.record({
        id:`study:${study.id}:v${study.definition.version}:complete`,
        type:'study.complete',
        xp:0,
        meaningful:true,
        metrics:{reflections:1}
      });
    }
    return state;
  };

  function library(){return Object.freeze(GUIDED_STUDIES.map(freezeLibraryItem))}

  function open(id,options={}){
    const study=getGuidedStudy(id);
    if(activeStudy)lesson.close();
    activeStudy=study;
    try{
      const opened=lesson.open(study.definition,{restart:options?.restart===true});
      reconcile(opened.state);
      return Object.freeze({resumed:opened.resumed,...decorate(opened.state)});
    }catch(error){
      activeStudy=null;
      try{lesson.close()}catch{}
      throw error;
    }
  }

  function getState(){return decorate(lesson.getState())}

  function respond(value){
    requireOpen();
    const result=lesson.respond(value);
    reconcile(result.state);
    return Object.freeze({applied:result.applied,duplicate:result.duplicate,feedback:result.feedback,...decorate(result.state)});
  }

  function advance(){
    requireOpen();
    const result=lesson.advance();
    reconcile(result.state);
    return Object.freeze({completed:result.completed,duplicate:result.duplicate,completion:result.completion||null,...decorate(result.state)});
  }

  function restart(){
    requireOpen();
    const restarted=lesson.restart();
    return Object.freeze({resumed:false,...decorate(restarted.state)});
  }

  function prepareReader(){
    const study=requireOpen();
    reader.setBook(study.passage.code,study.passage.chapter);
    return Object.freeze({...study.passage});
  }

  function close(){
    if(activeStudy)lesson.close();
    activeStudy=null;
  }

  return Object.freeze({library,open,getState,respond,advance,restart,prepareReader,close,completionXp:0});
}

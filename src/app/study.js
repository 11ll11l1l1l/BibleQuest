import { GUIDED_STUDIES, getGuidedStudy } from '../features/study/content.js';
import { assertBinaryScorable, reviewAuthoredBinary } from '../core/doctrinal-safety.js';

const freezeLibraryItem=study=>Object.freeze({id:study.id,title:study.title,kicker:study.kicker,description:study.description,duration:study.duration,passage:Object.freeze({...study.passage})});
const safetyForStep=(study,step)=>{
  if(!step||step.type!=='choice'||step.answer==null)return null;
  const safety=reviewAuthoredBinary({q:step.prompt,a:step.feedback?.correct||step.choices?.[step.answer]||'',ref:step.reference},{label:`Guided Study ${study.id} step ${step.id}`});
  assertBinaryScorable({q:step.prompt,ref:step.reference,safety},`Guided Study ${study.id} step ${step.id}`);
  return safety;
};
const auditStudy=study=>{for(const step of study.definition.steps)safetyForStep(study,step);return study};

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
    const rawStep=state.status==='complete'?null:study.definition.steps[state.index]||null;
    return Object.freeze({
      study:freezeLibraryItem(study),
      percent,
      safety:safetyForStep(study,rawStep),
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

  function library(){return Object.freeze(GUIDED_STUDIES.map(study=>freezeLibraryItem(auditStudy(study))))}

  function open(id,options={}){
    const study=auditStudy(getGuidedStudy(id));
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

  function getState(){requireOpen();return decorate(lesson.getState())}

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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WISDOM_SITUATIONS, localizeWisdomSituation } from '../../src/features/wisdom-situations/content.js';
import { createWisdomSituationsService } from '../../src/app/wisdom-situations.js';

const startedAt='2026-10-18T12:00:00.000Z';
const createLesson=()=>{
  let state=null;
  return {
    open(_definition,{restart=false}={}){
      if(restart||!state)state={startedAt,responses:{}};
      return {state,resumed:!restart};
    },
    getState(){return state;},
    respond(choice){state={...state,responses:{...state.responses,judgment:choice}};return {state,applied:true,duplicate:false,feedback:null};},
    advance(){return {state,completed:true};},
    restart(){state={startedAt,responses:{}};return {state};},
    close(){}
  };
};

test('every case: translated choices and rationales remain aligned after deterministic shuffle and submission',()=>{
  let completions=0;
  for(const item of WISDOM_SITUATIONS)for(const locale of ['tl','ceb']){
    const lesson=createLesson();
    const ids=[];
    const progress={record:event=>{ids.push(event.id);return {awardedXp:8};}};
    let activeLocale=locale;
    const service=createWisdomSituationsService({lesson,progress,getLocale:()=>activeLocale,random:()=>0.6});
    const question=service.open(item.id,{restart:true});
    const localized=localizeWisdomSituation(item,locale);
    assert.equal(question.answered,false);
    assert.equal(question.situation.scenario,localized.scenario);
    assert.equal(question.situation.options.length,4);
    for(let displayIndex=0;displayIndex<4;displayIndex++){
      const translatedOption=question.situation.options[displayIndex];
      const canonicalIndex=localized.options.indexOf(translatedOption);
      assert.ok(canonicalIndex>=0,`${locale} ${item.id} display choice not found`);
      assert.equal(question.situation.basis[displayIndex],localized.basis[canonicalIndex],`${locale} ${item.id} incorrect basis order`);
    }
    const chosenDisplayIndex=3;
    const canonicalIndex=localized.options.indexOf(question.situation.options[chosenDisplayIndex]);
    const result=service.answer(chosenDisplayIndex);
    assert.equal(result.answered,true);
    assert.equal(result.selected,chosenDisplayIndex);
    assert.equal(lesson.getState().responses.judgment,canonicalIndex);
    assert.equal(result.situation.rationales[chosenDisplayIndex],localized.rationales[canonicalIndex]);
    assert.equal(result.situation.best,question.situation.options.indexOf(localized.options[item.best]));
    assert.equal(ids[0],`wisdom-situation:${item.id}:v1`);
    activeLocale=locale==='tl'?'ceb':'tl';
    const switched=service.getState();
    assert.equal(switched.situation.scenario,localizeWisdomSituation(item,activeLocale).scenario);
    assert.equal(switched.selected,chosenDisplayIndex);
    service.close();
    completions++;
  }
  assert.equal(completions,144);
});

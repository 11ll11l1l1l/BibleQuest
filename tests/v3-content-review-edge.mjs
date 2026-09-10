import assert from 'node:assert/strict';
import { createContentReviewService } from '../src/app/content-review.js';

const fixedTime='2026-09-11T01:30:00.000Z';
const baseManifest={books:[{code:'RUT',name:'Ruth',questions:53,path:'data/packs/questions/RUT.json',quarantinedQuestions:3},{code:'JHN',name:'John',questions:448,path:'data/packs/questions/JHN.json',quarantinedQuestions:0}]};
const quarantine=[{id:'q1',reference:'1:1',question:'Why did Naomi leave?',answer:'Because of famine.',safety:{action:'quarantine',topics:['context']}}];
const baseQueue={
  decisions:[],
  reports:[{id:7,congregation_id:'c1',reporter_id:'member-1',content_key:'v3:study:item-1',content_type:'question',content_source:'v3-screen',content_ref:'John 3:16',content_text:'Reported wording',content_payload:{answer:'Captured answer'},reason:'accuracy',note:'Please verify.',status:'open',reviewed_by:null,reviewed_at:null,created_at:'2026-09-10T00:00:00Z',updated_at:'2026-09-10T00:00:00Z'}],
  members:[{user_id:'member-1',display_name:'Mina',role:'member',avatar:null,active:true,joined_at:'2026-01-01'}]
};
const membership=(role='leader',id='c1',name='First Church')=>({congregationId:id,userId:'reviewer-1',role,roleKnown:true,roleLabel:role[0].toUpperCase()+role.slice(1),congregation:{id,name}});

function harness({authenticated=true,memberships=[membership()],siteAccess=null,platformCongregations=[],queue=baseQueue,platformError=null,saveError=null,markError=null}={}){
  const calls={platformAccess:0,platformCongregations:0,loadQueue:[],save:[],mark:[],quarantine:[]};
  const session={getState:()=>({authenticated,user:authenticated?{id:'reviewer-1'}:null})};
  const congregation={async load(){return structuredClone(memberships)}};
  const api={
    async platformAccess(){calls.platformAccess+=1;if(platformError)throw platformError;return siteAccess?structuredClone(siteAccess):null},
    async listPlatformCongregations(){calls.platformCongregations+=1;return structuredClone(platformCongregations)},
    async loadQueue(id){calls.loadQueue.push(id);return structuredClone(queue)},
    async saveDecision(row){calls.save.push(structuredClone(row));if(saveError)throw saveError;return structuredClone(row)},
    async markReportsReviewed(congregationId,contentKey,reviewedBy,reviewedAt){calls.mark.push({congregationId,contentKey,reviewedBy,reviewedAt});if(markError)throw markError;return [{id:7}]}
  };
  const recall={
    async loadManifest(){return structuredClone(baseManifest)},
    async loadQuarantine(code){calls.quarantine.push(code);return structuredClone(quarantine)}
  };
  const service=createContentReviewService({api,session,congregation,recall,clock:()=>new Date(fixedTime)});
  return {service,calls};
}

{
  const {service,calls}=harness({authenticated:false,memberships:[]});
  const state=await service.refresh();
  assert.equal(state.status,'signed-out');
  assert.equal(calls.platformAccess,0,'Signed-out Content Review must not query remote reviewer access.');
}

for(const role of ['member','facilitator']){
  const {service}=harness({memberships:[membership(role)]});
  const state=await service.refresh();
  assert.equal(state.status,'unauthorized',`${role} must not receive Content Review authority.`);
}

for(const role of ['leader','pastor','admin']){
  const {service,calls}=harness({memberships:[membership(role)]});
  const state=await service.refresh();
  assert.equal(state.status,'ready',`${role} membership should be eligible for congregation review.`);
  assert.equal(state.congregationId,'c1');
  assert.equal(state.scopes[0].role,role);
  assert.deepEqual(calls.loadQueue,['c1']);
  assert.deepEqual(state.books.map(row=>row.code),['RUT'],'Only books with quarantined items should be offered to the workbench.');
}

{
  const {service,calls}=harness({memberships:[],siteAccess:{role:'owner',active:true},platformCongregations:[{id:'c2',name:'Platform Church',active:true}] ,queue:{decisions:[],reports:[],members:[]}});
  const state=await service.refresh();
  assert.equal(state.status,'ready','Platform owner must receive reviewer scopes through the retained RLS path.');
  assert.equal(state.congregationId,'c2');
  assert.equal(state.platformRole,'owner');
  assert.equal(state.scopes[0].source,'platform');
  assert.equal(calls.platformCongregations,1);
}

{
  const {service}=harness({memberships:[],siteAccess:{role:'viewer',active:true}});
  assert.equal((await service.refresh()).status,'unauthorized','Unknown platform roles must fail closed.');
}

{
  const {service}=harness({memberships:[],platformError:new Error('Access lookup denied')});
  const state=await service.refresh();
  assert.equal(state.status,'error');
  assert.match(state.error,/Access lookup denied/);
}

{
  const {service}=harness({memberships:[membership('leader')],platformError:new Error('Platform role lookup unavailable')});
  const state=await service.refresh();
  assert.equal(state.status,'ready','A verified congregation reviewer must not be blocked solely because optional platform-role lookup failed.');
  assert.match(state.warning,/Platform role lookup unavailable/);
}

{
  const {service}=harness({memberships:[membership('leader','c1'),membership('pastor','c2','Second Church')],queue:{decisions:[],reports:[],members:[]}});
  assert.equal((await service.refresh()).congregationId,'c1');
  assert.equal((await service.selectCongregation('c2')).congregationId,'c2');
  const denied=await service.selectCongregation('other');
  assert.equal(denied.status,'error');
  assert.match(denied.error,/cannot review that congregation/i);
}

{
  const {service,calls}=harness();
  await service.refresh();
  const state=await service.openQuarantine('RUT');
  assert.equal(state.selectedBook,'RUT');
  assert.deepEqual(calls.quarantine,['RUT']);
  assert.equal(state.quarantine[0].contentKey,'question:RUT:q1');
  assert.equal(state.quarantine[0].origin,'quarantine');
  assert.equal(service.reportItems()[0].reporter.displayName,'Mina','Report presenter must resolve reporter display through the loaded congregation directory.');

  const result=await service.decide({contentKey:'question:RUT:q1',decision:'include',rationale:'Context checked.'});
  assert.equal(result.saved,true);
  assert.equal(result.partial,false);
  assert.equal(calls.save.length,1);
  const saved=calls.save[0];
  assert.equal(saved.congregation_id,'c1');
  assert.equal(saved.content_key,'question:RUT:q1');
  assert.equal(saved.content_type,'question');
  assert.equal(saved.origin,'quarantine');
  assert.equal(saved.decision,'include');
  assert.equal(saved.reviewed_by,'reviewer-1');
  assert.equal(saved.reviewed_at,fixedTime);
  assert.equal(saved.updated_at,fixedTime);
  assert.equal(saved.rationale,'Context checked.');
  assert.deepEqual(saved.content_snapshot,{book_code:'RUT',id:'q1',question:'Why did Naomi leave?',answer:'Because of famine.',ref:'1:1',safety:{action:'quarantine',topics:['context']}});
  assert.equal(calls.mark.length,1,'Decision save must resolve matching open reports through the API boundary.');
  assert.equal(service.decisionFor('question:RUT:q1').decision,'include');
}

{
  const {service,calls}=harness();
  await service.refresh();
  await service.openQuarantine('RUT');
  await assert.rejects(()=>service.decide({contentKey:'question:RUT:q1',decision:'delete'}),error=>error.code==='BQ_CONTENT_REVIEW_DECISION_INVALID');
  await assert.rejects(()=>service.decide({contentKey:'question:RUT:q1',decision:'include',rationale:'x'.repeat(1201)}),error=>error.code==='BQ_CONTENT_REVIEW_RATIONALE_INVALID');
  await assert.rejects(()=>service.decide({contentKey:'missing',decision:'remove'}),error=>error.code==='BQ_CONTENT_REVIEW_ITEM_INVALID');
  assert.equal(calls.save.length,0,'Invalid reviewer input must fail before database write orchestration.');
}

{
  const {service,calls}=harness();
  await service.refresh();
  const result=await service.decide({contentKey:'v3:study:item-1',decision:'remove',rationale:'Incorrect wording.'});
  assert.equal(result.saved,true);
  const saved=calls.save[0];
  assert.equal(saved.origin,'user_report');
  assert.equal(saved.content_type,'question');
  assert.equal(saved.content_ref,'John 3:16');
  assert.deepEqual(saved.content_snapshot,{text:'Reported wording',ref:'John 3:16',payload:{answer:'Captured answer'},reason:'accuracy'});
  assert.equal(service.reportItems()[0].status,'reviewed','Successful review must update matching local report state without reload.');
}

{
  const failure=new Error('RLS denied decision');
  const {service,calls}=harness({saveError:failure});
  await service.refresh();
  await assert.rejects(()=>service.decide({contentKey:'v3:study:item-1',decision:'exempt'}),error=>error===failure);
  assert.equal(calls.mark.length,0,'Report resolution must not run when the decision write failed.');
}

{
  const {service,calls}=harness({markError:new Error('Report update denied')});
  await service.refresh();
  await assert.rejects(()=>service.decide({contentKey:'v3:study:item-1',decision:'include'}),error=>error.code==='BQ_CONTENT_REVIEW_PARTIAL_SAVE');
  assert.equal(calls.save.length,1);
  assert.equal(calls.mark.length,1);
  assert.equal(service.decisionFor('v3:study:item-1').decision,'include','A partial-save error must preserve knowledge that the decision itself committed.');
  assert.match(service.getState().error,/decision was saved/i);
}

{
  const {service}=harness();
  await service.refresh();
  await assert.rejects(()=>service.openQuarantine('BAD!'),error=>error.code==='BQ_CONTENT_REVIEW_BOOK_INVALID');
  assert.equal(service.clear().status,'idle');
}

console.log('BibleQuest v3 Content Review role/queue/write edge regression passed.');

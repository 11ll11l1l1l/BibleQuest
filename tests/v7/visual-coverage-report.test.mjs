import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeV7VisualCoverage } from '../../scripts/v7-visual-coverage-report.mjs';

const queues = [
  ['anxiety_worry','fear','sadness','grief_loss','loneliness','anger'],
  ['hurt_betrayal','rejection','guilt','shame','insecurity_unworthiness','doubt'],
  ['confusion_uncertainty','discouragement','hopelessness','overwhelm','stress','tiredness_weariness'],
  ['spiritual_dryness_distance','temptation','impatience_waiting','jealousy_envy','frustration','numbness_emptiness'],
  ['joy','gratitude','peace_contentment','hope','excitement','love_connection']
].map((initialQueue,i)=>({agentId:'visual-agent-'+(i+1),initialQueue}));
const fake = (assets, options={})=>({
  status:options.status||'PASS', errors:options.errors||[],
  warnings:options.warnings||[],
  manifest:{schemaVersion:1,assets,byContent:{}}
});
const asset=(queueConcept, canonicalContentId, status='partial', variants=[])=>({
  assetId:'bqv7-emotion-'+queueConcept.replace(/_/g,'-')+'-01',
  contentType:'emotion', contentId:queueConcept,
  queueConcept,canonicalContentId,bundleStatus:status,variants
});

test('all 30 absent feelings produce exactly five deterministic, disjoint queues',()=>{
  const result=summarizeV7VisualCoverage(fake([]),queues);
  assert.equal(result.summary.emotionTotal,30);
  assert.equal(result.summary.missingMasters,30);
  assert.equal(result.summary.completeThreeFileBundles,0);
  assert.equal(result.summary.productionReadyMasters,0);
  assert.deepEqual(result.agents.map(x=>x.missingMasters),[6,6,6,6,6]);
  assert.equal(result.agents[0].nextWork.queueConcept,'anxiety_worry');
  assert.equal(result.agents[4].nextWork.canonicalEmotionId,'joyful');
});

test('verified three-file bundles count separately from ready CLEAN and pending QA candidates',()=>{
  const a=asset('anxiety_worry','anxious','partial',[]);
  const b=asset('fear','afraid','complete',[
    {kind:'with_text',locale:'en',src:'/v7/images/emotion/fear-type.webp'},
    {kind:'thumbnail',src:'/v7/images/emotion/fear-thumb.webp'}
  ]);
  const records=[{
    name:a.assetId+'-derivatives.json',
    derivativeFor:a.assetId,
    status:'three_files_present_render_qa_pending'
  }];
  const result=summarizeV7VisualCoverage(fake([a,b]),queues,records);
  assert.equal(result.status,'PASS');
  assert.equal(result.releaseEligible,true);
  assert.equal(result.summary.productionReadyMasters,2);
  assert.equal(result.summary.completeThreeFileBundles,1);
  assert.equal(result.summary.pendingDerivativeBackfills,1);
  assert.equal(result.summary.candidateDerivativeSidecars,1);
  assert.equal(result.summary.missingMasters,28);
  assert.equal(result.agents[0].nextWork.action,'verify_and_consolidate_derivatives');
  assert.equal(result.agents[0].nextWork.verifiedTypographyLocales.length,0);
  assert.equal(result.agents[0].tasks[0].fallback,'clean_master_with_live_localized_label');
  assert.deepEqual(result.agents[0].tasks[1].verifiedTypographyLocales,['en']);
  assert.equal(result.agents[0].tasks[1].action,'complete');
});

test('pending non-production master does not inflate publication metrics',()=>{
  const result=summarizeV7VisualCoverage(fake([]),queues,[{
    name:'bqv7-emotion-peace-contentment-01.json',
    contentId:'peaceful',
    status:'three_files_present_local_render_pass_browser_qa_pending'
  }]);
  assert.equal(result.summary.productionReadyMasters,0);
  assert.equal(result.summary.pendingMasterQa,1);
  assert.equal(result.summary.missingMasters,29);
  assert.equal(result.agents[4].tasks[2].action,'finish_pending_master_qa');
});

test('unverified registry and contradictory canonical emotion fail safely',()=>{
  const invalid=summarizeV7VisualCoverage(
    fake([], {status:'FAIL',errors:['image hash mismatch']}),queues);
  assert.equal(invalid.releaseEligible,false);
  assert.deepEqual(invalid.errors,['image hash mismatch']);
  assert.throws(()=>summarizeV7VisualCoverage(fake([
    asset('fear','anxious')
  ]),queues),/Unrecognized release emotion identity/);
});

test('duplicate queue assignment is rejected before a misleading handoff is published',()=>{
  const bad=structuredClone(queues);
  bad[1].initialQueue[0]='fear';
  assert.throws(()=>summarizeV7VisualCoverage(fake([]),bad),
    /Unknown or duplicate queued concept/);
});

test('canonical contentId for a published V2 asset still counts its original agent assignment',()=>{
  const canonical=asset('impatience_waiting','impatient','complete',[
    {kind:'with_text',locale:'en'},
    {kind:'thumbnail'}
  ]);
  canonical.contentId='impatient';
  const result=summarizeV7VisualCoverage(fake([canonical]),queues);
  assert.equal(result.summary.completeThreeFileBundles,1);
  assert.equal(result.agents[3].completeBundles,1);
  assert.equal(result.agents[3].tasks[2].queueConcept,'impatience_waiting');
  assert.equal(result.agents[3].tasks[2].canonicalEmotionId,'impatient');
  assert.equal(result.agents[3].tasks[2].action,'complete');
});

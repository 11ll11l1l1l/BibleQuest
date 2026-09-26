import assert from 'node:assert/strict';
import test from 'node:test';

import { renderRecallLibraryView, renderRecallQuestionView, renderRecallCompleteView } from '../../src/features/games/views/recall.js';
import { renderSoloCompleteView, renderSoloQuestionView } from '../../src/features/games/views/solo.js';

const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]??char));

test('Recall library preserves search, book, source and launcher contracts',()=>{
  const games={
    visibleRecallBooks:()=>[{code:'jn',name:'John <Book>',questions:4}],
    recallSummary:()=>({review:2,seen:3,last:{remembered:2,total:4}}),
  };
  const html=renderRecallLibraryView({state:{recallQuery:'John <',source:'Open <source>',license:'CC'},games,escapeHtml});
  assert.match(html,/data-recall-search/);
  assert.match(html,/value="John &lt;"/);
  assert.match(html,/data-recall-book="jn"/);
  assert.match(html,/John &lt;Book&gt;/);
  assert.match(html,/2 review · 3 studied · last 2\/4/);
  assert.match(html,/data-game-launcher/);
});

test('Recall question keeps reveal and rating actions mutually phased',()=>{
  const base={index:0,total:2,remembered:0,gained:0,recallBook:{name:'John'},recallItem:{id:'r1',question:'Who?',answer:'Jesus',reference:'1:1',contextNote:'Read context.'},source:'Open',license:'CC'};
  const hidden=renderRecallQuestionView({state:{...base,revealed:false},escapeHtml});
  assert.match(hidden,/data-recall-reveal/);
  assert.doesNotMatch(hidden,/data-recall-rate=/);
  const revealed=renderRecallQuestionView({state:{...base,revealed:true},escapeHtml});
  assert.match(revealed,/data-recall-answer/);
  assert.match(revealed,/data-recall-rate="again"/);
  assert.match(revealed,/data-recall-rate="got"/);
  assert.match(revealed,/data-recall-context/);
});

test('Recall completion preserves replay, library and launcher actions',()=>{
  const html=renderRecallCompleteView({state:{recallBook:{name:'Ruth'},remembered:3,total:4,reviewAgain:1,gained:15,remainingReview:1},escapeHtml});
  assert.match(html,/3\/4/);
  assert.match(html,/data-recall-replay/);
  assert.match(html,/data-recall-library/);
  assert.match(html,/data-game-launcher/);
  assert.match(html,/game-recall-deck\.png/);
});

test('Solo question preserves answer hooks, locked feedback and V6 presentation marker',()=>{
  const state={score:1,gained:5,index:0,total:1,locked:true,question:{book:'John',mode:'basic',level:1}};
  const presentation={progressPercent:0,question:{questionId:'q1',progressLabel:'Question 1 of 1',prompt:'Prompt <x>',choices:[{index:0,accessibleLabel:'Answer A',marker:'A',text:'Choice',selected:true,correct:true}]},feedback:{heading:'Correct',explanation:'Why',reference:'John 1:1'}};
  const html=renderSoloQuestionView({state,escapeHtml,presentation,recallSource:'<small data-source>source</small>'});
  assert.match(html,/data-v6-game-presentation="question"/);
  assert.match(html,/data-game-answer="0"/);
  assert.match(html,/disabled/);
  assert.match(html,/data-game-feedback/);
  assert.match(html,/See results/);
  assert.match(html,/data-source/);
});

test('Solo completion keeps result presentation labels and navigation hooks',()=>{
  const html=renderSoloCompleteView({state:{modeTitle:'Quick',total:10},escapeHtml,resultView:{accuracyPercent:90,scoreLabel:'9/10',xpLabel:'+90 XP'}});
  assert.match(html,/data-v6-game-presentation="result"/);
  assert.match(html,/game-winner-trophy\.png/);
  assert.match(html,/9\/10/);
  assert.match(html,/data-game-replay/);
  assert.match(html,/data-game-home/);
});

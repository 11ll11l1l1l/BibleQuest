import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assignedPath, assignedCurriculumPage, renderAssignedCards, safeAssignedCover } from '../../src/features/discipleship-curriculum/index.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
const rows = [{ id:'secret-track-id', title:'<unsafe & private>', modules:[{
  id:'module-1',title:'Start',lessons:[{id:'lesson-1',revisionId:'revision-1',title:'Hope'}],
}]}];
const translate = key => ({track:'Track',module:'Module',lesson:'Lesson',open:'Open'}[key] || key);

test('assigned curriculum cards preserve live, escaped text and existing button navigation selectors', () => {
  const html = renderAssignedCards(assignedPath(rows,{view:'track'}), translate);
  assert.match(html, /class="bq-assigned-cards"/);
  assert.match(html, /data-assigned-index="0"/);
  assert.match(html, /data-assigned-media="0"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /&lt;unsafe &amp; private&gt;/);
  assert.doesNotMatch(html, /<unsafe|secret-track-id|<img/i);
  assert.match(html, /<strong class="bq-assigned-card__title">/);
  for(const [view,kind] of [['track','module'],['module','lesson']]) {
    const result=assignedPath(rows,{view,trackId:'secret-track-id',moduleId:'module-1'});
    assert.match(renderAssignedCards(result,translate), new RegExp('bq-assigned-card--' + kind));
  }
});

test('only audited local asset identity can enter optional curriculum card artwork', () => {
  const accepted=safeAssignedCover({src:'/v7/images/hero/bqv7-cover-01.webp',assetId:'bqv7-cover-01',focalPoint:{x:.25,y:.8}});
  assert.deepEqual(accepted,{src:'/v7/images/hero/bqv7-cover-01.webp',assetId:'bqv7-cover-01',x:.25,y:.8});
  assert.equal(safeAssignedCover({src:'https://evil.example/cover.webp',assetId:'bqv7-cover-01'}),null);
  assert.equal(safeAssignedCover({src:'/v7/images/hero/../../private.webp',assetId:'bqv7-cover-01'}),null);
  assert.equal(safeAssignedCover({src:'/v7/images/hero/cover.webp?token=private',assetId:'bqv7-cover-01'}),null);
  assert.equal(safeAssignedCover({src:'/v7/images/hero/cover.webp',assetId:'unreviewed'}),null);
});

test('assigned card CSS provides large touch controls, readable real text, and static-mode fallbacks', () => {
  const css=readFileSync(new URL('../../src/ui/v7-one-to-one-lesson.css',import.meta.url),'utf8');
  assert.match(css,/\.bq-assigned-card \{/);
  assert.match(css,/min-height: 188px/);
  assert.match(css,/\.bq-assigned-card:focus-visible/);
  assert.match(css,/@media \(max-width: 360px\)/);
  assert.match(css,/:root\[data-bq-effective-motion="reduce"\]/);
  assert.match(css,/\.bq-assigned-card__image/);
});

test('assigned card hierarchy still routes through scoped pair, track, module and revision', async () => {
  const routes=[];
  const map=new Map();
  const status={textContent:''},host={innerHTML:'',querySelectorAll(){return [];}};
  const page={
    querySelector(sel){return sel==='[data-assigned-status]'?status:host;},
    addEventListener(event,handler){map.set(event,handler);},
    removeEventListener(event){map.delete(event);},
  };
  const ui=assignedCurriculumPage({
    service:{async loadCurriculum(){return rows;}},
    view:'track',pairId:'pair-1',isContextReady:()=>true,
    subscribeContext(){return()=>{};},onNavigate(route){routes.push(route);},
    onBack(){},onAccount(){},onCongregation(){},coverProvider:async()=>null,
  });
  const dispose=ui.mount({querySelector(){return page;}});
  await tick();
  assert.match(host.innerHTML,/data-assigned-index="0"/);
  const button={disabled:false,closest(){return this;},getAttribute(k){return k==='data-assigned-index'?'0':null;},hasAttribute(k){return k==='data-assigned-index';}};
  map.get('click')({target:button});
  assert.deepEqual(routes,[{routeKey:'one-to-one-track',pairId:'pair-1',trackId:'secret-track-id'}]);
  dispose();
  assert.equal(map.size,0);
});

test('disposal or tenant switching discards delayed approved art before DOM injection', async () => {
  let resolveCover,contextListener,ready=true,painted=0;
  const cover=new Promise(resolve=>{resolveCover=resolve;});
  const status={textContent:''};
  const host={innerHTML:'',querySelectorAll(){return [{
    ownerDocument:{createElement(){painted++;return {style:{},setAttribute(){},addEventListener(){},remove(){}};}},
    prepend(){},
  }];}};
  const page={querySelector(sel){return sel==='[data-assigned-status]'?status:host;},addEventListener(){},removeEventListener(){}};
  const ui=assignedCurriculumPage({
    service:{async loadCurriculum(){return rows;}},
    view:'track',pairId:'pair-1',isContextReady:()=>ready,
    subscribeContext(fn){contextListener=fn;return()=>{};},
    onNavigate(){},onBack(){},onAccount(){},onCongregation(){},
    coverProvider:()=>cover,
  });
  const dispose=ui.mount({querySelector(){return page;}});
  await tick();
  assert.match(host.innerHTML,/bq-assigned-card/);
  ready=false;contextListener();
  assert.equal(host.innerHTML,'');
  resolveCover({src:'/v7/images/hero/cover.webp',assetId:'bqv7-cover'});
  await tick();
  assert.equal(painted,0);
  dispose();
});

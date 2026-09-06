(()=>{'use strict';
const A=window.BQ2;if(!A)return;
const STORIES=Array.isArray(window.BQ_STORIES)?window.BQ_STORIES:[];
const DEEP=Array.isArray(window.BQ_DEEP_QUESTIONS)?window.BQ_DEEP_QUESTIONS:[];
const SITUATIONS=Array.isArray(window.BQ_SITUATIONS)?window.BQ_SITUATIONS:[];
const {$,$$,esc,pageHead,shuffled,toast}=A;
const WISDOM_ANSWERS=Object.freeze({w1:2,w2:2,w3:2,w4:1,w5:1,w6:2});
function hub(){
  $('#main').innerHTML=`${pageHead('Study & Reflect','Story journeys, practical wisdom, and open discussion prompts.')}<div class="game-menu"><a class="game-tile" href="#/story"><span class="icon">▤</span><strong>Story Journey</strong><p>Walk through a Bible story scene by scene, then answer a checkpoint.</p></a><a class="game-tile" href="#/wisdom"><span class="icon">◇</span><strong>Wisdom Situations</strong><p>Apply biblical principles to work, money, relationships, and online life.</p></a><a class="game-tile" href="#/deep"><span class="icon">?</span><strong>Deep Questions</strong><p>Open discussion prompts with multiple Scripture references.</p></a></div>`;
}
function story(){
  const s=shuffled(STORIES)[0];if(!s)return toast('Story data unavailable');let scene=0;
  const paint=()=>{
    $('#main').innerHTML=`${pageHead(s.title,s.book,'<a class="btn secondary" href="#/study">Study</a>')}<div class="card quiz-card"><div class="quiz-meta"><span>Scene ${scene+1} / ${s.scenes.length}</span><span>${esc(s.book)}</span></div><div class="progress"><span style="width:${(scene+1)/s.scenes.length*100}%"></span></div><p class="question" style="font-size:19px">${esc(s.scenes[scene])}</p>${scene<s.scenes.length-1?'<button class="btn" id="nextScene">Next scene</button>':`<div class="section-title"><h2>Checkpoint</h2></div><p><strong>${esc(s.checkpoint.q)}</strong></p><div class="choices">${s.checkpoint.choices.map((x,i)=>`<button class="choice" data-story-answer="${i}">${esc(x)}</button>`).join('')}</div><div id="storyAnswer"></div>`}</div>`;
    if($('#nextScene'))$('#nextScene').onclick=()=>{scene++;paint()};
    $$('[data-story-answer]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.storyAnswer),ok=i===s.checkpoint.answer;$$('[data-story-answer]').forEach((x,n)=>x.classList.add(n===s.checkpoint.answer?'correct':n===i?'wrong':''));$('#storyAnswer').innerHTML=`<div class="answer-note"><strong>${ok?'Correct':'Review'}</strong> · ${esc(s.checkpoint.ref)}</div>`;A.activity(ok?18:7)});
  };paint();
}
function wisdom(){
  const s=shuffled(SITUATIONS)[0];if(!s)return toast('Situation data unavailable');
  const best=WISDOM_ANSWERS[s.id];
  if(!Number.isInteger(best))return toast('This situation needs answer review before scoring.');
  $('#main').innerHTML=`${pageHead('Wisdom Situation',s.title,'<a class="btn secondary" href="#/study">Study</a>')}<div class="card quiz-card"><p class="question" style="font-size:19px">${esc(s.scenario)}</p><div class="choices">${s.options.map((x,i)=>`<button class="choice" data-situation="${i}">${esc(x)}</button>`).join('')}</div><div id="situationResult"></div></div>`;
  $$('[data-situation]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.situation);$$('[data-situation]').forEach((x,n)=>{x.disabled=true;x.classList.add(n===best?'correct':n===i?'wrong':'')});$('#situationResult').innerHTML=`<div class="answer-note"><strong>${i===best?'Good judgment':'Consider the stronger response'}</strong><br>${esc(s.note)}<br><br><strong>References:</strong> ${s.refs.map(esc).join(' · ')}</div>`;A.activity(i===best?12:5)});
}
function deep(){
  const d=shuffled(DEEP)[0];if(!d)return toast('Discussion data unavailable');
  $('#main').innerHTML=`${pageHead('Deep Question','Discussion, not a scored doctrine item.','<a class="btn secondary" href="#/study">Study</a>')}<div class="card quiz-card"><h2 class="question">${esc(d.q)}</h2><p>${esc(d.context)}</p><div class="choices">${d.options.map((x,i)=>`<button class="choice" data-deep="${i}">${esc(x)}</button>`).join('')}</div><div id="deepResult"></div></div>`;
  $$('[data-deep]').forEach(b=>b.onclick=()=>{$$('[data-deep]').forEach(x=>x.disabled=true);b.classList.add('correct');$('#deepResult').innerHTML=`<div class="answer-note"><strong>Your response:</strong> ${esc(b.textContent)}<br><br><strong>Read and compare:</strong> ${d.refs.map(esc).join(' · ')}<br><button class="btn secondary small" id="saveDeepNote" style="margin-top:10px">Save a note</button></div>`;$('#saveDeepNote').onclick=()=>{sessionStorage.setItem('bq2.note.seed',`${d.q}\n\nReferences: ${d.refs.join(', ')}\n\n`);location.hash='#/notes'}});
}
A.route('study',hub);A.route('story',story);A.route('wisdom',wisdom);A.route('deep',deep);
})();

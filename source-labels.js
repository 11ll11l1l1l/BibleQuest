(() => {
  const badge=(text,kind='bible')=>`<span class="bq-source-badge ${kind}">${text}</span>`;
  let queued=false;

  function injectHomeGuide(){
    const anchor=document.querySelector('.data-note');
    if(!anchor||document.querySelector('.bq-source-guide'))return;
    anchor.insertAdjacentHTML('afterend',`<section class="bq-source-guide">
      <div class="eyebrow">Sources & Bible version</div>
      <h3>Alam mo kung saan galing ang content.</h3>
      <div class="bq-source-grid">
        <div>${badge('BSB','bible')}<p><b>Bible text:</b> Berean Standard Bible. Ito ang English Bible text na ginagamit ng Reader at verse-text games kapag available.</p></div>
        <div>${badge('uW TQ v90','questions')}<p><b>Recall questions:</b> unfoldingWord Translation Questions v90 · CC BY-SA 4.0. Ang “source answer” ay galing sa question resource, hindi awtomatikong BSB quotation.</p></div>
        <div>${badge('OBS','story')}<p><b>Story content:</b> Open Bible Stories · CC BY-SA 4.0. Bible-story retelling ito, hindi Bible translation.</p></div>
      </div>
      <p class="bq-source-rule">Rule ng BibleQuest: kapag actual Bible verse text ang ipinapakita, ilalagay ang Bible version. Kapag reference lang, hindi kami magpapanggap na quoted text iyon.</p>
    </section>`);
  }

  function labelReader(){
    const article=document.querySelector('.verse-list');
    const host=document.querySelector('.reader-title-row');
    if(!article||!host)return;
    const scripture=article.dataset.bqScripture||'';
    const applied=article.dataset.bqAppliedVersion||scripture;
    let sourceBadge=host.querySelector('.bq-source-badge');
    if(scripture==='BSB'&&applied==='BSB'){
      if(!sourceBadge)host.insertAdjacentHTML('beforeend',badge('BSB · Berean Standard Bible'));
      article.querySelectorAll('p').forEach(p=>p.setAttribute('data-bq-scripture','BSB'));
    }else if(sourceBadge?.textContent?.includes('BSB')){
      sourceBadge.remove();
    }
  }

  function labelSequence(){
    const host=document.querySelector('.sequence-round-head');
    if(host&&!host.querySelector('.bq-source-badge'))host.insertAdjacentHTML('beforeend',badge('BSB'));
    document.querySelectorAll('.sequence-card p').forEach(p=>p.setAttribute('data-bq-scripture','BSB'));
  }

  function labelOpenReview(){
    const card=document.querySelector('.open-review-card');
    if(card&&!card.querySelector('.bq-source-row'))card.insertAdjacentHTML('beforeend',`<div class="bq-source-row">${badge('uW Translation Questions v90','questions')}<span>Reference answer source · Scripture reference shown when supplied</span></div>`);
    document.querySelectorAll('.open-review-card h1,.open-answer,.flashcard h2,.answer-reveal').forEach(x=>x.setAttribute('data-bq-source-content','uw-tq'));
  }

  function labelStory(){
    document.querySelectorAll('.story-scene-text,.story-copy,.obs-scene,.story-current,.story-next-choices p').forEach(x=>x.setAttribute('data-bq-source-content','obs'));
  }

  function apply(){injectHomeGuide();labelReader();labelSequence();labelOpenReview();labelStory()}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})}

  document.addEventListener('DOMContentLoaded',()=>{
    schedule();
    const root=document.body;
    if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  },{once:true});
  window.addEventListener('bq-modern-home-rendered',schedule);
  window.addEventListener('bq-reader-rendered',schedule);
  window.addEventListener('bq-reader-translation-applied',schedule);
  setTimeout(schedule,120);
})();

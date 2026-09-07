import { getContentProvenance } from '../../core/content-provenance.js';
import { sourceLabel } from '../../ui/source-labels.js';
import { doctrinalNotice } from '../../ui/doctrinal-safety.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const STORY_SOURCE=sourceLabel(getContentProvenance('bq-retelling'),{compact:true});
const CHECKPOINT_SOURCE=sourceLabel(getContentProvenance('bq-recall'),{compact:true});

export function storyJourneyPage({storyJourney,onReader,onLearn}){
  return{
    title:'Story Journey',
    html:'<section data-story-page></section>',
    mount(root){
      const host=root.querySelector('[data-story-page]');
      let disposed=false;

      const renderLibrary=()=>{
        if(disposed)return;
        const items=storyJourney.library();
        host.innerHTML=`<section class="bq-panel bq-story-head"><p class="bq-eyebrow">STORY JOURNEY</p><h1>Walk through the Bible story</h1><p>Move scene by scene, then answer one Scripture-based checkpoint. Story Journey keeps the original +15 XP correct / +4 XP incorrect reward.</p><div class="bq-story-head-actions"><button type="button" class="bq-primary-button" data-story-random>Start a random story</button><button type="button" class="bq-secondary-button" data-story-learn>Back to Learn</button></div></section><section class="bq-story-library" aria-label="Story Journeys">${items.map(item=>`<article class="bq-panel bq-story-card"><div class="bq-story-icon" aria-hidden="true">${escapeHtml(item.emoji)}</div><div><span>${escapeHtml(item.book)}</span><h2>${escapeHtml(item.title)}</h2><p>${item.sceneCount} scenes + checkpoint</p></div><button type="button" class="bq-secondary-button" data-story-open="${escapeHtml(item.id)}">Open story</button></article>`).join('')}</section>`;
      };

      const renderActive=result=>{
        if(disposed)return;
        const {story,state,percent}=result;
        const checkpointNotice=doctrinalNotice(story.checkpoint.safety,{compact:true});
        if(state.status==='complete'){
          const feedback=state.feedback.checkpoint;
          const correct=feedback?.correct===true;
          const reward=correct?15:4;
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-story-library>All stories</button></section><section class="bq-panel bq-story-session" data-story-complete="${escapeHtml(story.id)}"><div class="bq-story-finish-icon" aria-hidden="true">${escapeHtml(story.emoji)}</div><p class="bq-eyebrow">STORY COMPLETE</p><h1>${escapeHtml(story.title)}</h1><div class="bq-story-result ${correct?'is-correct':'is-review'}"><strong>${correct?'You followed the key idea':'Revisit the key moment'}</strong><span>+${reward} XP</span><p>📖 ${escapeHtml(story.checkpoint.reference)}</p></div>${checkpointNotice}${CHECKPOINT_SOURCE}<div class="bq-story-actions"><button type="button" class="bq-primary-button" data-story-another>Another story</button><button type="button" class="bq-secondary-button" data-story-restart>Replay this story</button><button type="button" class="bq-secondary-button" data-story-reader>Open Scripture</button><button type="button" class="bq-secondary-button" data-story-learn>Back to Learn</button></div></section>`;
          return;
        }

        const step=state.currentStep;
        if(step.type==='content'){
          const sceneNumber=state.index+1;
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-story-library>All stories</button><span>${escapeHtml(story.book)}</span></section><section class="bq-panel bq-story-session" data-story-session="${escapeHtml(story.id)}"><div class="bq-game-meta"><span>${escapeHtml(story.emoji)} ${escapeHtml(story.title)}</span><span>Scene ${sceneNumber} of ${story.sceneCount}</span></div><div class="bq-game-progress" aria-label="${percent}% complete"><i style="width:${percent}%"></i></div><div class="bq-story-scene"><span>${sceneNumber}</span><p>${escapeHtml(step.prompt)}</p></div>${STORY_SOURCE}<div class="bq-story-actions"><button type="button" class="bq-primary-button" data-story-advance>${sceneNumber===story.sceneCount?'Go to checkpoint':'Continue story'}</button></div></section>`;
          return;
        }

        if(step.type==='choice'){
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-story-library>All stories</button><span>${escapeHtml(story.book)}</span></section><section class="bq-panel bq-story-session" data-story-checkpoint="${escapeHtml(story.id)}"><p class="bq-eyebrow">STORY CHECKPOINT</p><h1>${escapeHtml(step.prompt)}</h1><div class="bq-study-choices">${step.choices.map((choice,index)=>`<button type="button" class="bq-game-choice" data-story-choice="${index}"><span aria-hidden="true">${String.fromCharCode(65+index)}</span><b>${escapeHtml(choice)}</b></button>`).join('')}</div><p class="bq-story-reference">📖 ${escapeHtml(story.checkpoint.reference)}</p>${checkpointNotice}${CHECKPOINT_SOURCE}</section>`;
        }
      };

      const showError=error=>{if(disposed)return;host.innerHTML=`<section class="bq-panel" role="alert"><p class="bq-eyebrow">STORY JOURNEY</p><h1>Story could not continue</h1><p>${escapeHtml(error?.message||'Unknown Story Journey error.')}</p><button type="button" class="bq-secondary-button" data-story-library>Back to stories</button></section>`};
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        try{
          if(target.closest('[data-story-learn]')){storyJourney.close();onLearn?.();return}
          if(target.closest('[data-story-library]')){storyJourney.close();renderLibrary();return}
          if(target.closest('[data-story-random]')){renderActive(storyJourney.startRandom());return}
          if(target.closest('[data-story-another]')){renderActive(storyJourney.another());return}
          if(target.closest('[data-story-restart]')){renderActive(storyJourney.restart());return}
          if(target.closest('[data-story-reader]')){storyJourney.prepareReader();onReader?.();return}
          if(target.closest('[data-story-advance]')){renderActive(storyJourney.advance());return}
          const choice=target.closest('[data-story-choice]');if(choice){renderActive(storyJourney.answer(Number(choice.dataset.storyChoice)));return}
          const open=target.closest('[data-story-open]');if(open){renderActive(storyJourney.open(open.dataset.storyOpen));return}
        }catch(error){showError(error)}
      };

      host.addEventListener('click',onClick);renderLibrary();
      return()=>{disposed=true;host.removeEventListener('click',onClick);storyJourney.close()};
    }
  };
}

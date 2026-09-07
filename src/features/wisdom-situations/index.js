import { getContentProvenance } from '../../core/content-provenance.js';
import { sourceLabel } from '../../ui/source-labels.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const WISDOM_SOURCE=sourceLabel(getContentProvenance('bq-wisdom'),{compact:true});

export function wisdomSituationsPage({wisdom,onLearn}){
  return{
    title:'Wisdom Situations',
    html:'<section data-wisdom-page></section>',
    mount(root){
      const host=root.querySelector('[data-wisdom-page]');
      let disposed=false;

      const render=result=>{
        if(disposed)return;
        const {situation,state,answered}=result;
        const selected=answered?state.responses.judgment:null;
        const correct=answered?state.feedback.judgment?.correct===true:false;
        if(answered){
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-wisdom-learn>Back to Learn</button><span>Difficulty ${situation.difficulty}/5</span></section><section class="bq-panel bq-wisdom-session" data-wisdom-complete="${escapeHtml(situation.id)}"><p class="bq-eyebrow">SITUATIONS &amp; WISDOM</p><h1>${escapeHtml(situation.title)}</h1><span class="bq-wisdom-tension">${escapeHtml(situation.tension)}</span><div class="bq-wisdom-result ${correct?'is-strong':'is-review'}"><strong>${correct?'Strong judgment':'A stronger judgment is available'}</strong><span>+8 XP</span><p><b>Strongest supported option: ${String.fromCharCode(65+situation.best)}.</b> ${escapeHtml(situation.why)}</p></div><div class="bq-wisdom-rationales">${situation.options.map((option,index)=>`<article class="${index===situation.best?'is-best':''} ${index===selected?'is-selected':''}"><b>${String.fromCharCode(65+index)} · ${index===situation.best?'Strongest':'Plausible but weaker'}${index===selected?' · Your choice':''}</b><p>${escapeHtml(situation.rationales[index])}</p></article>`).join('')}</div><p class="bq-wisdom-refs">📖 ${situation.refs.map(escapeHtml).join(' · ')}</p><p class="bq-wisdom-warning">This is a wisdom exercise about the strongest supported judgment in a complex case, not a declaration that every real-life case has one universally binding response.</p>${WISDOM_SOURCE}<div class="bq-wisdom-actions"><button type="button" class="bq-primary-button" data-wisdom-another>Another hard situation</button><button type="button" class="bq-secondary-button" data-wisdom-restart>Try this situation again</button><button type="button" class="bq-secondary-button" data-wisdom-learn>Back to Learn</button></div></section>`;
          return;
        }
        host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-wisdom-learn>Back to Learn</button><span>Difficulty ${situation.difficulty}/5</span></section><section class="bq-panel bq-wisdom-session" data-wisdom-session="${escapeHtml(situation.id)}"><p class="bq-eyebrow">HARD JUDGMENT MODE</p><h1>${escapeHtml(situation.title)}</h1><span class="bq-wisdom-tension">${escapeHtml(situation.tension)}</span><p class="bq-wisdom-scenario">${escapeHtml(situation.scenario)}</p><div class="bq-wisdom-options">${situation.options.map((option,index)=>`<button type="button" class="bq-game-choice" data-wisdom-choice="${index}"><span aria-hidden="true">${String.fromCharCode(65+index)}</span><b>${escapeHtml(option)}</b></button>`).join('')}</div><p class="bq-wisdom-warning">Choose the strongest supported judgment, not the answer that merely sounds most religious. All four options are intentionally plausible.</p>${WISDOM_SOURCE}</section>`;
      };

      const showError=error=>{if(disposed)return;host.innerHTML=`<section class="bq-panel" role="alert"><p class="bq-eyebrow">SITUATIONS &amp; WISDOM</p><h1>Wisdom Situation could not continue</h1><p>${escapeHtml(error?.message||'Unknown Wisdom Situations error.')}</p><button type="button" class="bq-secondary-button" data-wisdom-retry>Try another situation</button><button type="button" class="bq-secondary-button" data-wisdom-learn>Back to Learn</button></section>`};
      const start=()=>{try{render(wisdom.startRandom())}catch(error){showError(error)}};
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        try{
          if(target.closest('[data-wisdom-learn]')){wisdom.close();onLearn?.();return}
          if(target.closest('[data-wisdom-retry]')){start();return}
          if(target.closest('[data-wisdom-another]')){render(wisdom.another());return}
          if(target.closest('[data-wisdom-restart]')){render(wisdom.restart());return}
          const choice=target.closest('[data-wisdom-choice]');if(choice){render(wisdom.answer(Number(choice.dataset.wisdomChoice)));return}
        }catch(error){showError(error)}
      };

      host.addEventListener('click',onClick);start();
      return()=>{disposed=true;host.removeEventListener('click',onClick);wisdom.close()};
    }
  };
}

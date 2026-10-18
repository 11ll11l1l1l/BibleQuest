import { getContentProvenance } from '../../core/content-provenance.js';
import { localization } from '../../app/localization.js';
import { sourceLabel } from '../../ui/source-labels.js';
import { doctrinalNotice } from '../../ui/doctrinal-safety.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const WISDOM_SOURCE=sourceLabel(getContentProvenance('bq-wisdom'),{compact:true});
const HARD_CHOICE_LABELS=Object.freeze({
  en:Object.freeze({reason:'Why this is defensible',benefit:'Protects',cost:'Sacrifice',personal:'Personal cost'}),
  tl:Object.freeze({reason:'Dahilan kung bakit makatuwiran',benefit:'Pinoprotektahan',cost:'Sakripisyo',personal:'Personal na kapalit'}),
  ceb:Object.freeze({reason:'Rason nganong depensable',benefit:'Gipanalipdan',cost:'Sakripisyo',personal:'Personal nga kapalit'})
});
const displayHardChoice=(option,basis,locale='en')=>{
  const labels=HARD_CHOICE_LABELS[locale]||HARD_CHOICE_LABELS.en;
  const outcome=String(option).match(/^(.+?)[.] Benefit: (.+?)[.] Cost 1: (.+?)[.] Cost 2: (.+?)[.]$/);
  if(!outcome)return `<b>${escapeHtml(option)}</b>`;
  const line=(label,value)=>`<span style="display:block;font-weight:400;margin-top:0.3em"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</span>`;
  return `<b>${escapeHtml(outcome[1])}</b>${line(labels.reason,basis)}${line(labels.benefit,outcome[2])}${line(labels.cost,outcome[3])}${line(labels.personal,outcome[4])}`;
};
const COPY=Object.freeze({
  en:Object.freeze({
    back:'Back to Learn',eyebrow:'SITUATIONS & WISDOM',mode:'HARD JUDGMENT MODE',difficulty:'Difficulty',seen:'Seen this cycle',
    strong:'Decision examined',stronger:'Decision examined',strongest:'Editorial preference for these circumstances',plausible:'Defensible alternative',choice:'Your choice',
    refs:'References',warning:'Every option protects a serious duty and imposes a sacrifice. The purpose is to defend a judgment and face its strongest objection, not guess a morally superior letter.',
    choose:'Choose which duty you will prioritize, and whose cost you are willing to carry. Do not choose by answer length or apparent religious virtue.',
    reflection:'There is no revealed correct letter. Ask: Who is bearing the greatest involuntary cost? Which fact would reverse your judgment? Could you explain your decision honestly to everyone affected?',
    another:'Another hard situation',restart:'Try this situation again',retry:'Try another situation',error:'Wisdom Situation could not continue',
    xp:'+8 XP',reviewed:'Reviewed · no extra XP',foundation:'Foundation',advanced:'Advanced',expert:'Expert'
  }),
  tl:Object.freeze({
    back:'Bumalik sa Learn',eyebrow:'SITUATIONS & WISDOM',mode:'MAHIRAP NA PAGHATOL',difficulty:'Hirap',seen:'Nakita sa cycle',
    strong:'Nasuri ang pasya',stronger:'Nasuri ang pasya',strongest:'Mas piniling pasya sa sitwasyong ito',plausible:'Mapagtatanggol na pagpipilian',choice:'Pinili mo',
    refs:'Mga Sanggunian',warning:'Wisdom exercise ito tungkol sa pinakamatibay na suportadong paghatol sa komplikadong sitwasyon. Hindi nito sinasabing iisa lamang ang obligadong sagot sa lahat ng tunay na kaso.',
    choose:'Pumili ng pananagutang uunahin mo at ng sakripisyong kaya mong panindigan.',reflection:'Walang ipinapakitang iisang tamang titik. Sino ang nagdadala ng pinakamalaking pasaning hindi pinili? Anong bagong katotohanan ang magpapabago sa iyong pasya?',
    another:'Isa pang mahirap na sitwasyon',restart:'Subukan ulit ang sitwasyong ito',retry:'Subukan ang ibang sitwasyon',error:'Hindi maipagpatuloy ang Wisdom Situation',
    xp:'+8 XP',reviewed:'Na-review · walang dagdag na XP',foundation:'Foundation',advanced:'Advanced',expert:'Expert'
  }),
  ceb:Object.freeze({
    back:'Balik sa Learn',eyebrow:'SITUATIONS & WISDOM',mode:'LISOD NGA PAGHUKOM',difficulty:'Kalisod',seen:'Nakita niini nga cycle',
    strong:'Nasusi ang pasya',stronger:'Nasusi ang pasya',strongest:'Gipalabi nga paghukom dinhi',plausible:'Makatarunganong laing pagpili',choice:'Imong gipili',
    refs:'Mga Reperensya',warning:'Wisdom exercise kini bahin sa pinakalig-on nga suportadong paghukom sa komplikadong sitwasyon. Dili kini nagpasabot nga usa ra ka obligadong tubag ang sakto sa tanang real-life cases.',
    choose:'Pilia ang responsibilidad nga imong unahon ug ang sakripisyong imong madawat.',reflection:'Walay gipakita nga usa ka sakto nga letra. Kinsa ang nagdala sa pinakabug-at nga walay gipiling gasto? Unsang bag-ong kamatuoran ang makapausab sa imong hukom?',
    another:'Laing lisod nga sitwasyon',restart:'Sulayi pag-usab kini nga sitwasyon',retry:'Sulayi laing sitwasyon',error:'Dili mapadayon ang Wisdom Situation',
    xp:'+8 XP',reviewed:'Na-review · walay dugang XP',foundation:'Foundation',advanced:'Advanced',expert:'Expert'
  })
});
const copy=()=>COPY[localization.getLocale()]||COPY.en;
const packLabel=(t,pack)=>t[pack]||pack;

export function wisdomSituationsPage({wisdom,onLearn}){
  return{
    title:copy().eyebrow,
    html:'<section data-wisdom-page></section>',
    mount(root){
      const host=root.querySelector('[data-wisdom-page]');
      let disposed=false;

      const render=result=>{
        if(disposed)return;
        const t=copy(),{situation,answered,selected,cycle}=result;
        const safetyNotice=doctrinalNotice(situation.safety,{compact:true});
        const meta=`${packLabel(t,situation.pack)} · ${t.difficulty} ${situation.difficulty}/8 · ${t.seen} ${cycle.seen}/${cycle.total}`;
        if(answered){
          const xpAwarded=Number(result.progress?.awardedXp||0)>0;
          host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-wisdom-learn>${escapeHtml(t.back)}</button><span>${escapeHtml(meta)}</span></section><section class="bq-panel bq-wisdom-session" data-wisdom-complete="${escapeHtml(situation.id)}"><p class="bq-eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(situation.title)}</h1><span class="bq-wisdom-tension">${escapeHtml(situation.tension)}</span><div class="bq-wisdom-result is-reflection"><strong>${escapeHtml(t.strong)}</strong><span>${escapeHtml(xpAwarded?t.xp:t.reviewed)}</span><p>${escapeHtml(t.reflection)}</p></div><div class="bq-wisdom-rationales">${situation.options.map((option,index)=>`<article class="${index===selected?'is-selected':''}"><b>${String.fromCharCode(65+index)} · ${escapeHtml(index===selected?t.choice:t.plausible)}</b><p>${escapeHtml(situation.rationales[index])}</p></article>`).join('')}</div><p class="bq-wisdom-refs">${escapeHtml(t.refs)}: ${situation.refs.map(escapeHtml).join(' · ')}</p><p class="bq-wisdom-warning">${escapeHtml(t.warning)}</p>${safetyNotice}${WISDOM_SOURCE}<div class="bq-wisdom-actions"><button type="button" class="bq-primary-button" data-wisdom-another>${escapeHtml(t.another)}</button><button type="button" class="bq-secondary-button" data-wisdom-restart>${escapeHtml(t.restart)}</button><button type="button" class="bq-secondary-button" data-wisdom-learn>${escapeHtml(t.back)}</button></div></section>`;
          return;
        }
        host.innerHTML=`<section class="bq-game-topline"><button type="button" class="bq-secondary-button" data-wisdom-learn>${escapeHtml(t.back)}</button><span>${escapeHtml(meta)}</span></section><section class="bq-panel bq-wisdom-session" data-wisdom-session="${escapeHtml(situation.id)}"><p class="bq-eyebrow">${escapeHtml(t.mode)}</p><h1>${escapeHtml(situation.title)}</h1><span class="bq-wisdom-tension">${escapeHtml(situation.tension)}</span><p class="bq-wisdom-scenario">${escapeHtml(situation.scenario)}</p><div class="bq-wisdom-options">${situation.options.map((option,index)=>`<button type="button" class="bq-game-choice" data-wisdom-choice="${index}"><span aria-hidden="true">${String.fromCharCode(65+index)}</span>${displayHardChoice(option,situation.basis?.[index]||'',localization.getLocale())}</button>`).join('')}</div><p class="bq-wisdom-warning">${escapeHtml(t.choose)}</p>${safetyNotice}${WISDOM_SOURCE}</section>`;
      };

      const showError=error=>{
        if(disposed)return;
        const t=copy();
        host.innerHTML=`<section class="bq-panel" role="alert"><p class="bq-eyebrow">${escapeHtml(t.eyebrow)}</p><h1>${escapeHtml(t.error)}</h1><p>${escapeHtml(error?.message||'Unknown Wisdom Situations error.')}</p><button type="button" class="bq-secondary-button" data-wisdom-retry>${escapeHtml(t.retry)}</button><button type="button" class="bq-secondary-button" data-wisdom-learn>${escapeHtml(t.back)}</button></section>`;
      };
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

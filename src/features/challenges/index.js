import { localization } from '../../app/localization.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const COPY=Object.freeze({
  en:Object.freeze({
    eyebrow:'PERSONAL CHALLENGES',title:'Build one faithful habit at a time',
    intro:'Choose a challenge, work through its days in order, and return without losing your place. Signed-in progress resumes across devices.',
    notStarted:'Not started',resume:'Resume',complete:'Complete',start:'Start challenge',back:'Back to More',backList:'All challenges',
    next:'Next day',locked:'Locked',done:'Completed',mark:'Mark day complete',scripture:'Open Scripture',
    sequence:'Later days unlock after you complete the current day. BibleQuest does not treat these habits as a spiritual score.',
    completedBody:'Challenge complete. Your history remains saved so completion is not mistaken for a new start.'
  }),
  tl:Object.freeze({
    eyebrow:'PERSONAL CHALLENGES',title:'Bumuo ng isang tapat na habit sa bawat pagkakataon',
    intro:'Pumili ng challenge, sundan ang mga araw nang sunod-sunod, at bumalik nang hindi nawawala ang progress. Kapag naka-sign in, nagpapatuloy ito sa ibang device.',
    notStarted:'Hindi pa nasisimulan',resume:'Ipagpatuloy',complete:'Tapos',start:'Simulan ang challenge',back:'Bumalik sa More',backList:'Lahat ng challenge',
    next:'Susunod na araw',locked:'Naka-lock',done:'Tapos',mark:'Markahang tapos ang araw',scripture:'Buksan ang Kasulatan',
    sequence:'Magbubukas ang mga susunod na araw pagkatapos mong matapos ang kasalukuyang araw. Hindi ginagawang spiritual score ng BibleQuest ang mga habit na ito.',
    completedBody:'Tapos na ang challenge. Nananatiling naka-save ang history para hindi mapagkamalang bagong simula ang dating completion.'
  }),
  ceb:Object.freeze({
    eyebrow:'PERSONAL CHALLENGES',title:'Pagtukod og usa ka matinud-anong batasan matag higayon',
    intro:'Pilia ang challenge, sundon ang mga adlaw sa husto nga han-ay, ug makabalik nga dili mawala ang progress. Kung naka-sign in, mopadayon kini sa ubang device.',
    notStarted:'Wala pa masugdi',resume:'Padayon',complete:'Nahuman',start:'Sugdi ang challenge',back:'Balik sa More',backList:'Tanang challenge',
    next:'Sunod nga adlaw',locked:'Naka-lock',done:'Nahuman',mark:'Markahi nga nahuman ang adlaw',scripture:'Ablihi ang Kasulatan',
    sequence:'Ma-unlock ang sunod nga mga adlaw human mahuman ang kasamtangang adlaw. Dili himuong spiritual score sa BibleQuest kining mga batasan.',
    completedBody:'Nahuman na ang challenge. Magpabiling naka-save ang history aron dili isipon nga bag-ong pagsugod ang daang completion.'
  })
});
const copy=locale=>COPY[locale]||COPY.en;

export function challengesPage({challenges,onBack,onReader,locale=localization.getLocale()}={}){
  if(!challenges?.list||!challenges?.snapshot)throw new Error('Personal Challenges page requires the challenge owner.');
  return {
    title:'Personal Challenges',
    html:'<section data-personal-challenges-page></section>',
    mount(root){
      const host=root.querySelector('[data-personal-challenges-page]'),t=copy(locale);
      let selected='',message='',disposed=false;

      const statusLabel=row=>{
        if(row.complete)return t.complete;
        if(row.started)return row.completed+'/'+row.daysTotal+' · '+t.resume;
        return t.notStarted;
      };

      const renderList=()=>{
        const rows=challenges.list();
        host.innerHTML='<section class="bq-panel"><p class="bq-eyebrow">'+esc(t.eyebrow)+'</p><h1>'+esc(t.title)+'</h1><p>'+esc(t.intro)+'</p></section>'+
          rows.map(row=>'<section class="bq-panel" data-personal-challenge-card="'+esc(row.key)+'"><p class="bq-eyebrow">'+esc(row.type.toUpperCase())+'</p><h2>'+esc(row.title)+'</h2><p>'+esc(row.desc)+'</p><div class="bq-progress-stats"><div><b>'+row.completed+'/'+row.daysTotal+'</b><span>days</span></div><div><b>'+row.percent+'%</b><span>'+esc(statusLabel(row))+'</span></div></div><button type="button" class="bq-primary-button" data-personal-challenge-open="'+esc(row.key)+'">'+esc(row.complete?t.complete:row.started?t.resume:t.start)+'</button></section>').join('')+
          '<button type="button" class="bq-secondary-button" data-personal-challenges-back>'+esc(t.back)+'</button>';
      };

      const renderDetail=()=>{
        const row=challenges.snapshot(selected);
        const dayRows=row.days.map(day=>{
          const state=day.done?'done':day.isNext?'next':'locked';
          const action=day.done
            ? '<button type="button" class="bq-secondary-button" disabled>'+esc(t.done)+'</button>'
            : day.isNext
              ? '<button type="button" class="bq-primary-button" data-personal-challenge-complete="'+day.day+'">'+esc(t.mark)+'</button>'
              : '<button type="button" class="bq-secondary-button" disabled>'+esc(t.locked)+'</button>';
          const scripture=day.isNext&&day.code&&day.chapter
            ? '<button type="button" class="bq-secondary-button" data-personal-challenge-reader="'+esc(day.code)+'" data-personal-challenge-chapter="'+day.chapter+'">'+esc(t.scripture)+'</button>'
            : '';
          return '<li data-personal-challenge-day="'+day.day+'" data-personal-challenge-state="'+state+'"><span><b>Day '+day.day+' · '+esc(day.label)+'</b><small>'+esc(day.done?t.done:day.isNext?t.next:t.locked)+'</small></span><span>'+scripture+action+'</span></li>';
        }).join('');
        host.innerHTML='<section class="bq-panel"><p class="bq-eyebrow">'+esc(t.eyebrow)+'</p><h1>'+esc(row.title)+'</h1><p>'+esc(row.desc)+'</p><div class="bq-daily-progress" aria-label="'+row.percent+'%"><span style="width:'+row.percent+'%"></span></div><p>'+row.completed+'/'+row.daysTotal+' days · '+row.percent+'%</p><p>'+esc(t.sequence)+'</p>'+
          (!row.started?'<button type="button" class="bq-primary-button" data-personal-challenge-start>'+esc(t.start)+'</button>':'')+
          (row.started?'<ul class="bq-home-assignment-list">'+dayRows+'</ul>':'')+
          (row.complete?'<div class="bq-form-message" data-personal-challenge-complete-note>'+esc(t.completedBody)+'</div>':'')+
          '<p class="bq-form-message" data-personal-challenge-message aria-live="polite">'+esc(message)+'</p></section>'+
          '<button type="button" class="bq-secondary-button" data-personal-challenge-list>'+esc(t.backList)+'</button>';
      };

      const render=()=>{if(disposed)return;selected?renderDetail():renderList()};

      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;
        if(!target)return;
        const open=target.closest('[data-personal-challenge-open]');
        if(open){selected=open.dataset.personalChallengeOpen||'';message='';render();return}
        if(target.closest('[data-personal-challenges-back]')){onBack?.();return}
        if(target.closest('[data-personal-challenge-list]')){selected='';message='';render();return}
        if(target.closest('[data-personal-challenge-start]')){
          try{challenges.start(selected);message='';render()}catch(error){message=error?.message||'Could not start this challenge.';render()}
          return;
        }
        const complete=target.closest('[data-personal-challenge-complete]');
        if(complete){
          try{challenges.completeNext(selected,Number(complete.dataset.personalChallengeComplete));message='';render()}catch(error){message=error?.message||'Could not complete this day.';render()}
          return;
        }
        const reader=target.closest('[data-personal-challenge-reader]');
        if(reader){
          const code=reader.dataset.personalChallengeReader,chapter=Number(reader.dataset.personalChallengeChapter);
          if(code&&chapter)onReader?.({code,chapter});
        }
      };

      host.addEventListener('click',onClick);
      render();
      const unsubscribe=challenges.subscribe?.(()=>render())||(()=>{});
      return()=>{disposed=true;unsubscribe();host.removeEventListener('click',onClick)};
    }
  };
}

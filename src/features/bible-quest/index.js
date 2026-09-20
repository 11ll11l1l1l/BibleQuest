import { localization } from '../../app/localization.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const COPY=Object.freeze({
  en:Object.freeze({
    eyebrow:'MAIN QUEST',title:'Read the whole Bible',intro:'BibleQuest now has one clear destination: Genesis 1 to Revelation 22. Free reading stays separate and never moves this ordered Quest.',
    chapters:'chapters',books:'books',remaining:'remaining',continue:'Continue Bible Quest',free:'Read any book separately',
    today:'Today’s Quest',pace:'Daily pace',progress:'Overall Bible progress',current:'Next chapter',related:'Related Bible links',
    complete:'Bible Quest complete',completeBody:'You have completed all 1,189 chapters from Genesis through Revelation.',next:'next',openReader:'Open in BibleQuest Reader',back:'Back',perDay:'/day',canonical:'Genesis → Revelation',canonicalFull:'Genesis 1 → Revelation 22',completePercent:'complete'
  }),
  tl:Object.freeze({
    eyebrow:'PANGUNAHING QUEST',title:'Basahin ang buong Biblia',intro:'Iisa ang malinaw na destinasyon ng BibleQuest: Genesis 1 hanggang Pahayag 22. Hiwalay ang malayang pagbabasa at hindi nito nilalaktawan ang nakaayos na Quest.',
    chapters:'kabanata',books:'aklat',remaining:'natitira',continue:'Ipagpatuloy ang Bible Quest',free:'Magbasa ng ibang aklat nang hiwalay',
    today:'Quest ngayong araw',pace:'Kabanata bawat araw',progress:'Kabuuang Bible progress',current:'Susunod na kabanata',related:'Mga kaugnay na Bible link',
    complete:'Tapos ang Bible Quest',completeBody:'Natapos mo ang lahat ng 1,189 kabanata mula Genesis hanggang Pahayag.',next:'susunod',openReader:'Buksan sa BibleQuest Reader',back:'Bumalik',perDay:'/araw',canonical:'Genesis → Pahayag',canonicalFull:'Genesis 1 → Pahayag 22',completePercent:'kumpleto'
  }),
  ceb:Object.freeze({
    eyebrow:'PANGUNAHING QUEST',title:'Basaha ang tibuok Bibliya',intro:'Usa ra ang klarong tumong sa BibleQuest: Genesis 1 hangtod Pinadayag 22. Bulag ang libre nga pagbasa ug dili kini molaktaw sa sunod-sunod nga Quest.',
    chapters:'kapitulo',books:'libro',remaining:'nahibilin',continue:'Padayon sa Bible Quest',free:'Basaha ang bisan unsang libro nga bulag',
    today:'Quest karong adlawa',pace:'Kapitulo kada adlaw',progress:'Kinatibuk-ang Bible progress',current:'Sunod nga kapitulo',related:'May kalabotan nga Bible links',
    complete:'Nahuman ang Bible Quest',completeBody:'Nahuman nimo ang tanang 1,189 ka kapitulo gikan sa Genesis hangtod Pinadayag.',next:'sunod',openReader:'Ablihi sa BibleQuest Reader',back:'Balik',perDay:'/adlaw',canonical:'Genesis → Pinadayag',canonicalFull:'Genesis 1 → Pinadayag 22',completePercent:'nahuman'
  })
});
const copy=locale=>COPY[locale]||COPY.en;
const externalAttrs='target="_blank" rel="noopener noreferrer"';

function referenceLabel(target){return target?`${target.book} ${target.chapter}`:''}

export function bibleQuestPage({bibleQuest,reader,onContinue,onFreeRead,onBack,locale=localization.getLocale()}={}){
  if(!bibleQuest?.snapshot)throw new Error('Bible Quest page requires the Bible Quest owner.');
  return {
    title:'Bible Quest',
    html:'<section data-bible-quest-page></section>',
    mount(root){
      const host=root.querySelector('[data-bible-quest-page]');
      const t=copy(locale);
      let disposed=false;
      const render=()=>{
        if(disposed)return;
        const state=bibleQuest.snapshot(),next=state.next;
        const related=next&&reader?.referenceLinks?reader.referenceLinks(next.code,next.chapter):[];
        const questTargets=state.today.map((item,index)=>`<li><b>${index+1}. ${esc(referenceLabel(item))}</b>${index===0?`<span> · ${esc(t.next)}</span>`:''}</li>`).join('');
        const books=state.books.map(book=>`<li data-bible-quest-book="${esc(book.code)}"><span><b>${esc(book.name)}</b><small>${book.completed}/${book.chapters}</small></span><span>${book.complete?'✓':`${book.percent}%`}</span></li>`).join('');
        host.innerHTML=`<section class="bq-hero"><div><p class="bq-eyebrow">${esc(t.eyebrow)}</p><h1>${esc(t.title)}</h1><p>${esc(t.intro)}</p></div></section>
          <section class="bq-panel" data-bible-quest-summary>
            <p class="bq-eyebrow">${esc(t.progress)}</p>
            <h2>${state.completedChapters}/${state.totalChapters} ${esc(t.chapters)} · ${state.percent}%</h2>
            <div class="bq-daily-progress" aria-label="${state.percent}% ${esc(t.completePercent)}"><span style="width:${state.percent}%"></span></div>
            <div class="bq-progress-stats">
              <div><b>${state.completedBooks}/${state.totalBooks}</b><span>${esc(t.books)}</span></div>
              <div><b>${state.remainingChapters}</b><span>${esc(t.remaining)}</span></div>
              <div><b>${state.pace}</b><span>${esc(t.pace)}</span></div>
            </div>
          </section>
          ${state.complete?`<section class="bq-panel"><p class="bq-eyebrow">${esc(t.complete)}</p><h2>${esc(t.canonicalFull)}</h2><p>${esc(t.completeBody)}</p></section>`:`
          <section class="bq-panel" data-bible-quest-current>
            <p class="bq-eyebrow">${esc(t.current)}</p><h2>${esc(referenceLabel(next))}</h2>
            <button type="button" class="bq-primary-button" data-bible-quest-continue>${esc(t.continue)}</button>
            <button type="button" class="bq-secondary-button" data-bible-quest-free>${esc(t.free)}</button>
            <h3>${esc(t.related)}</h3>
            <div class="bq-external-links"><button type="button" class="bq-secondary-button" data-bible-quest-continue>${esc(t.openReader)}</button>${related.map(link=>`<a ${externalAttrs} href="${esc(link.href)}">${esc(link.label)}</a>`).join('')}</div>
          </section>
          <section class="bq-panel"><p class="bq-eyebrow">${esc(t.today)}</p><ol>${questTargets}</ol><div class="bq-daily-actions">${bibleQuest.allowedPaces.map(pace=>`<button type="button" class="${pace===state.pace?'bq-primary-button':'bq-secondary-button'}" data-bible-quest-pace="${pace}">${pace}${esc(t.perDay)}</button>`).join('')}</div></section>`}
          <section class="bq-panel"><h2>${esc(t.canonical)}</h2><ul class="bq-home-assignment-list">${books}</ul></section>
          <button type="button" class="bq-secondary-button" data-bible-quest-back>${esc(t.back)}</button>`;
      };
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;
        if(!target)return;
        if(target.closest('[data-bible-quest-continue]')){bibleQuest.activateNext();onContinue?.();return}
        if(target.closest('[data-bible-quest-free]')){bibleQuest.deactivate();onFreeRead?.();return}
        if(target.closest('[data-bible-quest-back]')){onBack?.();return}
        const pace=target.closest('[data-bible-quest-pace]');
        if(pace){bibleQuest.setPace(Number(pace.dataset.bibleQuestPace));render()}
      };
      host.addEventListener('click',onClick);
      render();
      return()=>{disposed=true;host.removeEventListener('click',onClick)};
    }
  };
}

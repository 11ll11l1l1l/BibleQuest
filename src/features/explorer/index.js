import { localization } from '../../app/localization.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const COPY=Object.freeze({
  en:Object.freeze({
    eyebrow:'BIBLE EXPLORER',title:'Characters & Places',intro:'Explore Scripture-grounded people and places without repeating an item until the current pool is exhausted. An unfinished clue case resumes where you left it.',
    people:'Who Am I?',peopleText:'Identify Bible people from clues.',places:'Where Is It?',placesText:'Identify biblical places from clues.',connections:'Connections',connectionsText:'Browse all people, places, locations, and Scripture references.',
    back:'Back to Learn',all:'Explorer home',clue:'Clue',another:'Another clue',reveal:'Reveal answer',answer:'Answer',scripture:'Open Scripture',next:'Next one',
    progress:'Seen this cycle',resume:'Resume saved case',newCase:'Start case',place:'Place',reference:'Scripture',source:'Curated from Scripture; prompts do not invent hidden facts.'
  }),
  tl:Object.freeze({
    eyebrow:'BIBLE EXPLORER',title:'Mga Tauhan at Lugar',intro:'Kilalanin ang mga tao at lugar sa Biblia nang hindi inuulit ang item hanggang matapos ang kasalukuyang pool. Kapag huminto ka sa isang clue, doon ka rin magpapatuloy.',
    people:'Sino Ako?',peopleText:'Kilalanin ang mga tauhan sa Biblia gamit ang mga clue.',places:'Saan Ito?',placesText:'Kilalanin ang mga lugar sa Biblia gamit ang mga clue.',connections:'Mga Koneksyon',connectionsText:'Tingnan ang mga tao, lugar, lokasyon, at Scripture references.',
    back:'Bumalik sa Learn',all:'Explorer home',clue:'Clue',another:'Isa pang clue',reveal:'Ipakita ang sagot',answer:'Sagot',scripture:'Buksan ang Kasulatan',next:'Susunod',
    progress:'Nakita sa cycle na ito',resume:'Ipagpatuloy ang naka-save',newCase:'Magsimula',place:'Lugar',reference:'Kasulatan',source:'Curated mula sa Kasulatan; hindi nag-iimbento ng nakatagong detalye ang prompts.'
  }),
  ceb:Object.freeze({
    eyebrow:'BIBLE EXPLORER',title:'Mga Tawo ug Lugar',intro:'I-explore ang mga tawo ug lugar sa Biblia nga walay pag-usab sa item hangtod mahurot ang kasamtangang pool. Ang wala mahuman nga clue mopadayon kung asa ka nihunong.',
    people:'Kinsa Ko?',peopleText:'Ilha ang mga tawo sa Biblia pinaagi sa mga clue.',places:'Asa Kini?',placesText:'Ilha ang mga lugar sa Biblia pinaagi sa mga clue.',connections:'Mga Koneksyon',connectionsText:'Tan-awa ang mga tawo, lugar, lokasyon, ug Scripture references.',
    back:'Balik sa Learn',all:'Explorer home',clue:'Clue',another:'Laing clue',reveal:'Ipakita ang tubag',answer:'Tubag',scripture:'Ablihi ang Kasulatan',next:'Sunod',
    progress:'Nakita niining cycle',resume:'Padayon sa naka-save',newCase:'Sugdi',place:'Lugar',reference:'Kasulatan',source:'Curated gikan sa Kasulatan; dili maghimo og tinagong detalye ang prompts.'
  })
});
const copy=locale=>COPY[locale]||COPY.en;

export function explorerPage({explorer,onBack,onReader,locale=localization.getLocale()}={}){
  if(!explorer?.snapshot||!explorer?.start||!explorer?.connections)throw new Error('Bible Explorer page requires the Explorer owner.');
  return {
    title:'Bible Explorer',
    html:'<section data-explorer-page></section>',
    mount(root){
      const host=root.querySelector('[data-explorer-page]'),t=copy(locale);
      let view='home',kind='person',message='',disposed=false;

      const renderHome=()=>{
        const people=explorer.snapshot('person'),places=explorer.snapshot('place');
        const action=row=>row.session&&!row.session.revealed?t.resume:t.newCase;
        host.innerHTML=
          '<section class="bq-panel"><p class="bq-eyebrow">'+esc(t.eyebrow)+'</p><h1>'+esc(t.title)+'</h1><p>'+esc(t.intro)+'</p><p><small>'+esc(t.source)+'</small></p></section>'+
          '<div class="bq-learning-grid">'+
            '<button type="button" class="bq-learning-card" data-explorer-mode="person"><b>'+esc(t.people)+'</b><span>'+esc(t.peopleText)+'</span><small>'+people.seenCount+'/'+people.total+' · '+esc(action(people))+'</small></button>'+
            '<button type="button" class="bq-learning-card" data-explorer-mode="place"><b>'+esc(t.places)+'</b><span>'+esc(t.placesText)+'</span><small>'+places.seenCount+'/'+places.total+' · '+esc(action(places))+'</small></button>'+
            '<button type="button" class="bq-learning-card" data-explorer-mode="connections"><b>'+esc(t.connections)+'</b><span>'+esc(t.connectionsText)+'</span></button>'+
          '</div>'+
          '<button type="button" class="bq-secondary-button" data-explorer-back>'+esc(t.back)+'</button>';
      };

      const renderCase=()=>{
        const state=explorer.snapshot(kind);
        if(!state.session){explorer.start(kind);return renderCase()}
        const session=state.session,item=session.item;
        if(session.revealed){
          host.innerHTML=
            '<section class="bq-panel" data-explorer-answer="'+esc(item.id)+'"><p class="bq-eyebrow">'+esc(t.answer.toUpperCase())+'</p><h1>'+esc(item.name)+'</h1><p>'+esc(item.clues.join(' · '))+'</p>'+
            '<dl><dt>'+esc(t.reference)+'</dt><dd>'+esc(item.refs)+'</dd><dt>'+esc(t.place)+'</dt><dd>'+esc(item.place)+'</dd></dl>'+
            '<p>'+esc(t.progress)+': '+state.seenCount+'/'+state.total+'</p>'+
            '<div class="bq-game-actions"><button type="button" class="bq-primary-button" data-explorer-next>'+esc(t.next)+'</button><button type="button" class="bq-secondary-button" data-explorer-reader>'+esc(t.scripture)+'</button></div></section>'+
            '<button type="button" class="bq-secondary-button" data-explorer-home>'+esc(t.all)+'</button>';
          return;
        }
        const clueNumber=session.clueIndex+1,totalClues=item.clues.length;
        host.innerHTML=
          '<section class="bq-panel" data-explorer-case="'+esc(item.id)+'"><p class="bq-eyebrow">'+esc(kind==='person'?t.people:t.places)+'</p><p>'+esc(t.progress)+': '+state.seenCount+'/'+state.total+'</p>'+
          '<h1>'+esc(t.clue)+' '+clueNumber+' / '+totalClues+'</h1><p data-explorer-current-clue>'+esc(session.clue)+'</p>'+
          '<div class="bq-game-actions">'+
            (clueNumber<totalClues?'<button type="button" class="bq-secondary-button" data-explorer-clue>'+esc(t.another)+'</button>':'')+
            '<button type="button" class="bq-primary-button" data-explorer-reveal>'+esc(t.reveal)+'</button>'+
          '</div><p class="bq-form-message" aria-live="polite">'+esc(message)+'</p></section>'+
          '<button type="button" class="bq-secondary-button" data-explorer-home>'+esc(t.all)+'</button>';
      };

      const renderConnections=()=>{
        const rows=explorer.connections();
        host.innerHTML=
          '<section class="bq-panel"><p class="bq-eyebrow">'+esc(t.connections.toUpperCase())+'</p><h1>'+esc(t.title)+'</h1><p>'+esc(t.connectionsText)+'</p></section>'+
          '<div class="bq-home-assignment-list">'+rows.map(item=>
            '<article data-explorer-connection="'+esc(item.id)+'"><b>'+esc(item.name)+'</b><small>'+esc(item.kind==='person'?t.people:t.places)+' · '+esc(item.place)+'</small><p>'+esc(item.refs)+'</p><button type="button" class="bq-secondary-button" data-explorer-connection-reader="'+esc(item.id)+'">'+esc(t.scripture)+'</button></article>'
          ).join('')+'</div>'+
          '<button type="button" class="bq-secondary-button" data-explorer-home>'+esc(t.all)+'</button>';
      };

      const render=()=>{
        if(disposed)return;
        if(view==='connections')renderConnections();
        else if(view==='case')renderCase();
        else renderHome();
      };

      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;
        if(!target)return;
        const mode=target.closest('[data-explorer-mode]');
        if(mode){
          const selected=mode.dataset.explorerMode;
          if(selected==='connections'){view='connections';render();return}
          kind=selected==='place'?'place':'person';
          try{explorer.start(kind);message='';view='case';render()}catch(error){message=error?.message||'Could not start Bible Explorer.';view='case';render()}
          return;
        }
        if(target.closest('[data-explorer-back]')){onBack?.();return}
        if(target.closest('[data-explorer-home]')){view='home';message='';render();return}
        if(target.closest('[data-explorer-clue]')){try{explorer.nextClue(kind);message='';render()}catch(error){message=error?.message||'Could not reveal another clue.';render()}return}
        if(target.closest('[data-explorer-reveal]')){try{explorer.reveal(kind);message='';render()}catch(error){message=error?.message||'Could not reveal this answer.';render()}return}
        if(target.closest('[data-explorer-next]')){try{explorer.nextCase(kind);message='';render()}catch(error){message=error?.message||'Could not open the next case.';render()}return}
        if(target.closest('[data-explorer-reader]')){
          const item=explorer.snapshot(kind).session?.item;
          if(item?.reader?.code&&item.reader.chapter)onReader?.(item.reader);
          return;
        }
        const connection=target.closest('[data-explorer-connection-reader]');
        if(connection){
          const item=explorer.connections().find(row=>row.id===connection.dataset.explorerConnectionReader);
          if(item?.reader?.code&&item.reader.chapter)onReader?.(item.reader);
        }
      };

      host.addEventListener('click',onClick);
      const unsubscribe=explorer.subscribe?.(()=>render())||(()=>{});
      render();
      return()=>{disposed=true;unsubscribe();host.removeEventListener('click',onClick)};
    }
  };
}

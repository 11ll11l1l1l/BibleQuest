(() => {
  const STORAGE_KEY='biblequest_translation_v1';
  const NLT_USAGE_KEY='biblequest_nlt_api_usage_v1';
  const MAIN=['BSB','TGL','JKO','NLT'];
  const VERSIONS={
    BSB:{code:'BSB',name:'Berean Standard Bible',mode:'bundled',note:'English · inside BibleQuest · offline after first book load'},
    TGL:{code:'TGL',name:'banal na Bibliya · Tagalog ULB',mode:'bundled',note:'Tagalog · inside BibleQuest · offline after first book load'},
    JKO:{code:'JKO',name:'口語訳聖書 (1954/1955)',mode:'live',note:'日本語 · 口語訳 · furigana & Japanese learning available'},
    NLT:{code:'NLT',name:'New Living Translation',mode:'live',note:'English · live from the official Tyndale NLT API · internet required'},
    ESV:{code:'ESV',name:'English Standard Version',mode:'licensed-link',note:'More translations · official reader'},
    NIV:{code:'NIV',name:'New International Version',mode:'licensed-link',note:'More translations · licensed reader'},
    AMP:{code:'AMP',name:'Amplified Bible',mode:'licensed-link',note:'More translations · licensed reader'}
  };
  const BOOK_NUM={GEN:1,EXO:2,LEV:3,NUM:4,DEU:5,JOS:6,JDG:7,RUT:8,'1SA':9,'2SA':10,'1KI':11,'2KI':12,'1CH':13,'2CH':14,EZR:15,NEH:16,EST:17,JOB:18,PSA:19,PRO:20,ECC:21,SNG:22,ISA:23,JER:24,LAM:25,EZK:26,DAN:27,HOS:28,JOL:29,AMO:30,OBA:31,JON:32,MIC:33,NAM:34,HAB:35,ZEP:36,HAG:37,ZEC:38,MAL:39,MAT:40,MRK:41,LUK:42,JHN:43,ACT:44,ROM:45,'1CO':46,'2CO':47,GAL:48,EPH:49,PHP:50,COL:51,'1TH':52,'2TH':53,'1TI':54,'2TI':55,TIT:56,PHM:57,HEB:58,JAS:59,'1PE':60,'2PE':61,'1JN':62,'2JN':63,'3JN':64,JUD:65,REV:66};
  window.BQ_BIBLE_TRANSLATIONS=VERSIONS;
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cache=new Map(),nltCache=new Map();let manifest=null,nltSessionRequests=0;
  const selected=()=>VERSIONS[localStorage.getItem(STORAGE_KEY)||'BSB']?localStorage.getItem(STORAGE_KEY)||'BSB':'BSB';
  const save=code=>{if(VERSIONS[code])localStorage.setItem(STORAGE_KEY,code)};
  const localDay=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
  function claimNltRequest(){
    const day=localDay();
    try{
      const prior=JSON.parse(localStorage.getItem(NLT_USAGE_KEY)||'{}');
      const count=prior.day===day?Number(prior.count)||0:0;
      if(count>=500)throw new Error('NLT anonymous daily request limit reached on this device');
      localStorage.setItem(NLT_USAGE_KEY,JSON.stringify({day,count:count+1}));
    }catch(e){
      if(String(e?.message||'').includes('daily request limit'))throw e;
      if(nltSessionRequests>=500)throw new Error('NLT anonymous daily request limit reached in this session');
      nltSessionRequests++;
    }
  }
  async function json(path){if(cache.has(path))return cache.get(path);const r=await fetch(path);if(!r.ok)throw new Error(`${path} returned ${r.status}`);const d=await r.json();cache.set(path,d);return d}
  async function liveText(path){if(nltCache.has(path))return nltCache.get(path);claimNltRequest();const r=await fetch(path,{headers:{Accept:'text/html'}});if(!r.ok)throw new Error(`NLT API returned ${r.status}`);const text=await r.text();if(!text.trim())throw new Error('NLT API returned an empty passage');nltCache.set(path,text);return text}
  function options(current){const render=codes=>codes.map(code=>{const v=VERSIONS[code];return `<option value="${code}" ${code===current?'selected':''}>${code==='JKO'?'日本語':code} · ${esc(v.name)}</option>`}).join('');const other=Object.keys(VERSIONS).filter(x=>!MAIN.includes(x));return `<optgroup label="Main translations">${render(MAIN)}</optgroup><optgroup label="More translations">${render(other)}</optgroup>`}
  function codeFromLayer(layer){return layer.querySelector('[data-reader-practice]')?.dataset.readerPractice||''}
  function context(layer){const title=layer.querySelector('.reader-title-row h1')?.textContent?.trim()||'';const chapter=Number(layer.querySelector('#readerChapter')?.value||title.match(/(\d+)$/)?.[1]||0);const book=layer.querySelector('.reader-top b')?.textContent?.trim()||title.replace(/\s+\d+$/,'');return {code:codeFromLayer(layer),book,chapter}}
  function external(code,book,chapter){const passage=`${book} ${chapter}`;if(code==='ESV')return `https://www.esv.org/${encodeURIComponent(passage).replace(/%20/g,'+')}/`;return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=${encodeURIComponent(code)}`}
  function sourceNotice(code){
    if(code==='BSB')return '<b>BSB · Berean Standard Bible</b> · English Scripture text delivered from BibleQuest on-demand book packs.';
    if(code==='TGL')return '<b>TGL · banal na Bibliya / Tagalog Unlocked Literal Bible</b> · © 2018 Door43 World Missions Community · CC BY-SA 4.0 · converted to on-demand book packs without intentional wording changes.';
    if(code==='JKO')return '<b>口語訳聖書 · 新約1954年 / 旧約1955年版</b> · GetBible の japkougo から章ごとに読み込みます。1955年版は著作権保護期間が終了していますが、著作者人格権は存続し、後年の訂正文言には別途権利があり得ます。BibleQuest は取得した聖書本文を改変せず、ふりがな・語彙メモ・英語説明を本文とは別の学習補助として表示します。';
    if(code==='NLT')return '<b>NLT · New Living Translation</b> · live passage text from Tyndale\'s official NLT API under its anonymous non-commercial web-use limits. Scripture quotations marked NLT are taken from the Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved. BibleQuest requests no more than 50 verses at a time and does not bundle the NLT corpus.';
    if(code==='ESV')return '<b>ESV · English Standard Version</b> · opens the selected passage on the official ESV reader because BibleQuest does not redistribute the full copyrighted text.';
    if(code==='NIV')return '<b>NIV · New International Version</b> · opens a licensed reader; full in-app redistribution requires permission.';
    return '<b>AMP · Amplified Bible</b> · opens a licensed reader; BibleQuest does not bulk-store the copyrighted text.';
  }
  function updateSource(panel,code){let n=panel.querySelector('[data-bq-version-source]');if(!n){n=document.createElement('div');n.className='reader-source';n.dataset.bqVersionSource='1';panel.appendChild(n)}if(n.dataset.code===code)return;n.dataset.code=code;n.innerHTML=sourceNotice(code)}
  function renderRows(article,rows,label){article.innerHTML=rows.map(v=>`<p data-verse="${Number(v.v)}"><sup>${Number(v.v)}</sup><span class="verse-text">${esc(v.t)}</span></p>`).join('');article.dataset.bqScripture=label}
  function disableJapanese(layer){window.BQJapaneseLearning?.disable?.(layer)}
  function loadFailure(article,layer,code,error){
    disableJapanese(layer);
    const japanese=code==='JKO';
    const title=japanese?'口語訳を読み込めませんでした。':'Tagalog text unavailable.';
    const detail=esc(error?.message||String(error||'Network or source error'));
    article.removeAttribute('data-bq-scripture');
    article.innerHTML=`<div class="reader-source reader-load-failure" role="status"><b>${title}</b><p>${detail}</p><p>${japanese?'ネット接続または GetBible の一時的な障害の可能性があります。聖書本文を推測して表示することはありません。':'The local Tagalog pack could not be loaded. BibleQuest will not substitute or invent Scripture text.'}</p><div class="actions"><button class="secondary" type="button" data-reader-version-retry>Retry ${japanese?'口語訳':'Tagalog'}</button><button class="secondary" type="button" data-reader-use-bsb>Use BSB</button></div></div>`;
    article.querySelector('[data-reader-version-retry]')?.addEventListener('click',()=>{article.dataset.bqAppliedVersion='';applyChapter(layer)});
    article.querySelector('[data-reader-use-bsb]')?.addEventListener('click',()=>{save('BSB');const picker=layer.querySelector('#bqTranslationSelect');if(picker)picker.value='BSB';article.dataset.bqAppliedVersion='';applyChapter(layer)});
  }
  function nltFailure(article,layer,error){
    disableJapanese(layer);
    const {book,chapter}=context(layer),detail=esc(error?.message||String(error||'Network or source error')),href=external('NLT',book,chapter);
    article.removeAttribute('data-bq-scripture');
    article.innerHTML=`<div class="reader-source reader-load-failure" role="status"><b>NLT text unavailable.</b><p>${detail}</p><p>The official Tyndale NLT API could not supply this passage. BibleQuest will not substitute another translation under an NLT label or invent missing Scripture text.</p><div class="actions"><button class="secondary" type="button" data-reader-version-retry>Retry NLT</button><button class="secondary" type="button" data-reader-use-bsb>Use BSB</button><a class="secondary" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Open licensed reader ↗</a></div></div>`;
    article.querySelector('[data-reader-version-retry]')?.addEventListener('click',()=>{article.dataset.bqAppliedVersion='';applyChapter(layer)});
    article.querySelector('[data-reader-use-bsb]')?.addEventListener('click',()=>{save('BSB');const picker=layer.querySelector('#bqTranslationSelect');if(picker)picker.value='BSB';article.dataset.bqAppliedVersion='';applyChapter(layer)});
  }
  function safeNltHtml(html){
    const doc=new DOMParser().parseFromString(String(html||''),'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select,link,meta,base').forEach(x=>x.remove());
    doc.querySelectorAll('*').forEach(el=>{[...el.attributes].forEach(a=>{const name=a.name.toLowerCase();if(name.startsWith('on')||name==='srcdoc'||name==='style'||name==='srcset')el.removeAttribute(a.name);if((name==='href'||name==='src')&&!/^(https?:|\/|#)/i.test(a.value||''))el.removeAttribute(a.name)});if(el.tagName==='A'&&el.target==='_blank')el.rel='noopener noreferrer'});
    return doc.body.innerHTML.trim();
  }
  function bsbVerseMax(article){
    const host=document.createElement('div');host.innerHTML=article.__bqBsbHtml||'';
    return Math.max(0,...[...host.querySelectorAll('[data-verse]')].map(x=>Number(x.dataset.verse)||0));
  }
  async function loadTagalog(article,layer){const {code,chapter}=context(layer);if(!code||!chapter)throw new Error('Passage context unavailable');manifest=manifest||await json('data/packs/manifest.json');const meta=(manifest.tagalog_books||[]).find(b=>b.code===code);if(!meta)throw new Error('Tagalog pack for this book is not available yet');article.innerHTML='<div class="reader-loading"><div class="reader-sheep">🇵🇭</div><p>Loading Tagalog Bible…</p></div>';const rows=(await json(meta.path)).filter(v=>Number(v.c)===chapter);if(!rows.length)throw new Error(`No Tagalog verses found for chapter ${chapter}`);if(selected()!=='TGL'||!article.isConnected)return;renderRows(article,rows,'TGL');disableJapanese(layer);const chip=layer.querySelector('.reader-title-row .reader-chip');if(chip)chip.textContent=`${meta.name} · ${rows.length} verses`}
  async function loadKougo(article,layer){const {code,chapter}=context(layer);const bookNo=BOOK_NUM[code];if(!bookNo||!chapter)throw new Error('Japanese passage context unavailable');article.innerHTML='<div class="reader-loading"><div class="reader-sheep">🇯🇵</div><p>口語訳を読み込んでいます…</p></div>';const data=await json(`https://api.getbible.net/v2/japkougo/${bookNo}/${chapter}.json`);if(selected()!=='JKO'||!article.isConnected)return;const raw=Array.isArray(data?.verses)?data.verses:Object.values(data?.verses||{});const rows=raw.map((v,i)=>({v:Number(v.verse??v.v??v.number??i+1),t:String(v.text??v.t??v.content??'').trim()})).filter(v=>v.v&&v.t);if(!rows.length)throw new Error('No verses returned for this chapter');renderRows(article,rows,'JKO');const chip=layer.querySelector('.reader-title-row .reader-chip');if(chip)chip.textContent=`${data.book_name||'口語訳'} · ${rows.length}節`;window.BQJapaneseLearning?.enhance?.(article,layer,rows)}
  async function loadNlt(article,layer){
    const {book,chapter}=context(layer),verseMax=bsbVerseMax(article);if(!book||!chapter||!verseMax)throw new Error('Passage verse range unavailable for safe NLT request');
    article.innerHTML='<div class="reader-loading"><div class="reader-sheep">📖</div><p>Loading NLT from Tyndale…</p></div>';
    const parts=[];
    for(let start=1;start<=verseMax;start+=50){
      if(selected()!=='NLT'||!article.isConnected)return;
      const end=Math.min(start+49,verseMax),ref=`${book} ${chapter}:${start}-${end}`,url=`https://api.nlt.to/api/passages?ref=${encodeURIComponent(ref)}&key=TEST`;
      const raw=await liveText(url),clean=safeNltHtml(raw);if(!clean)throw new Error(`NLT API returned no displayable text for verses ${start}-${end}`);parts.push(`<section class="nlt-live-chunk" data-nlt-range="${start}-${end}">${clean}</section>`);
    }
    if(selected()!=='NLT'||!article.isConnected)return;
    article.innerHTML=parts.join('');article.dataset.bqScripture='NLT';disableJapanese(layer);const chip=layer.querySelector('.reader-title-row .reader-chip');if(chip)chip.textContent=`NLT · live · ${verseMax} verses`;
  }
  function licensed(article,code,book,chapter){article.innerHTML=`<div class="reader-source"><b>${esc(code)} · ${esc(VERSIONS[code].name)}</b><p>This copyrighted edition opens in an approved/licensed external reader. BibleQuest does not redistribute its full text.</p></div><p><a class="reader-primary" href="${esc(external(code,book,chapter))}" target="_blank" rel="noopener noreferrer">Open ${esc(book)} ${chapter} · ${esc(code)} ↗</a></p>`}
  function applyChapter(layer){const panel=layer.querySelector('.reader-chapter');if(!panel)return false;const article=panel.querySelector('.verse-list'),tools=panel.querySelector('.chapter-tools');if(!article||!tools)return true;const code=selected();let picker=panel.querySelector('#bqTranslationSelect');if(!picker){const label=document.createElement('label');label.dataset.bqVersionPicker='1';label.innerHTML=`Version <select id="bqTranslationSelect">${options(code)}</select>`;tools.insertBefore(label,tools.firstChild);picker=label.querySelector('select');picker.onchange=()=>{save(picker.value);article.dataset.bqAppliedVersion='';applyChapter(layer)}}else picker.value=code;updateSource(panel,code);if(!article.__bqBsbHtml)article.__bqBsbHtml=article.innerHTML;if(article.dataset.bqAppliedVersion===code)return true;article.dataset.bqAppliedVersion=code;const ctx=context(layer);if(!ctx.book||!ctx.chapter)return true;if(code==='BSB'){article.innerHTML=article.__bqBsbHtml;article.dataset.bqScripture='BSB';disableJapanese(layer);return true}if(code==='TGL'){loadTagalog(article,layer).catch(e=>{if(selected()==='TGL')loadFailure(article,layer,'TGL',e)});return true}if(code==='JKO'){loadKougo(article,layer).catch(e=>{if(selected()==='JKO')loadFailure(article,layer,'JKO',e)});return true}if(code==='NLT'){loadNlt(article,layer).catch(e=>{if(selected()==='NLT')nltFailure(article,layer,e)});return true}disableJapanese(layer);licensed(article,code,ctx.book,ctx.chapter);return true}
  function applyLibrary(layer){const panel=layer.querySelector('.reader-panel');if(!panel||panel.classList.contains('reader-chapter'))return false;const search=panel.querySelector('#readerSearch');if(!search)return false;const code=selected();let picker=panel.querySelector('#bqTranslationSelectLibrary');if(!picker){const wrap=document.createElement('div');wrap.className='chapter-tools';wrap.dataset.bqLibraryVersion='1';wrap.innerHTML=`<label>Bible version <select id="bqTranslationSelectLibrary">${options(code)}</select></label><span class="reader-chip">${esc(VERSIONS[code].note)}</span>`;search.before(wrap);picker=wrap.querySelector('select');picker.onchange=()=>{save(picker.value);wrap.querySelector('.reader-chip').textContent=VERSIONS[picker.value].note;updateSource(panel,picker.value)}}else picker.value=code;updateSource(panel,code);return true}
  function enhance(){const layer=document.getElementById('bqReaderLayer');if(!layer||layer.classList.contains('hidden'))return;if(applyChapter(layer))return;applyLibrary(layer)}
  new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('change',e=>{if(e.target?.id==='readerChapter')setTimeout(enhance,0)});enhance();
  window.BQTranslations={versions:VERSIONS,main:MAIN,selected,select:code=>{save(code);enhance()}};
})();

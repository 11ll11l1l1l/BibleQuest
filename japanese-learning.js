(() => {
  const KEY='biblequest_japanese_learning_v1';
  const defaults={furigana:'support',learning:true};
  let tokenizer=null,tokenizerPromise=null,current={article:null,layer:null,rows:[]};
  const TERMS=[
    {term:'御心',reading:'みこころ',meaning:'神の望み・意志',simple:'神が望んでおられること',en:"God's will"},
    {term:'福音',reading:'ふくいん',meaning:'よい知らせ',simple:'イエス・キリストによる救いの知らせ',en:'gospel / good news'},
    {term:'信仰',reading:'しんこう',meaning:'神を信じ、信頼すること',simple:'神を信頼して従うこと',en:'faith'},
    {term:'恵み',reading:'めぐみ',meaning:'受ける資格ではなく与えられる神の好意',simple:'神から無償で与えられるよいもの',en:'grace'},
    {term:'救い',reading:'すくい',meaning:'危険や罪から救われること',simple:'神が人を罪とその結果から救うこと',en:'salvation'},
    {term:'救う',reading:'すくう',meaning:'危険や苦しみから助け出す',simple:'助け出す',en:'to save'},
    {term:'罪',reading:'つみ',meaning:'神の御心に反すること',simple:'神との正しい関係を壊す考えや行い',en:'sin'},
    {term:'義',reading:'ぎ',meaning:'正しいこと・神の前で正しい状態',simple:'神が正しいとされること',en:'righteousness'},
    {term:'愛',reading:'あい',meaning:'相手の益を求める愛',simple:'大切にし、相手のためによいことを求めること',en:'love'},
    {term:'祈り',reading:'いのり',meaning:'神に語りかけること',simple:'神に感謝・願い・思いを伝えること',en:'prayer'},
    {term:'祈る',reading:'いのる',meaning:'神に語りかける',simple:'神に感謝や願いを伝える',en:'to pray'},
    {term:'弟子',reading:'でし',meaning:'師から学び、その道に従う人',simple:'イエスから学び、従う人',en:'disciple'},
    {term:'復活',reading:'ふっかつ',meaning:'死から再び生きること',simple:'死んだ者が再び生きること',en:'resurrection'},
    {term:'永遠',reading:'えいえん',meaning:'終わりがないこと',simple:'いつまでも続くこと',en:'eternal / eternity'},
    {term:'聖霊',reading:'せいれい',meaning:'神の霊',simple:'信じる者に働かれる神の霊',en:'Holy Spirit'},
    {term:'契約',reading:'けいやく',meaning:'互いに結ばれる確かな約束',simple:'神と人との重要な約束・関係',en:'covenant'},
    {term:'預言',reading:'よげん',meaning:'神から託されたことばを伝えること',simple:'神のことばを人々に伝えること',en:'prophecy'},
    {term:'預言者',reading:'よげんしゃ',meaning:'神から託されたことばを伝える人',simple:'神のメッセージを伝える人',en:'prophet'},
    {term:'赦し',reading:'ゆるし',meaning:'罪・過ちを赦すこと',simple:'責め続けず、罪を赦すこと',en:'forgiveness'},
    {term:'赦す',reading:'ゆるす',meaning:'罪・過ちを赦免する',simple:'罪や過ちをゆるす',en:'to forgive'},
    {term:'悔い改め',reading:'くいあらため',meaning:'考えと方向を改めて神に向くこと',simple:'間違った道から神のほうへ向き直ること',en:'repentance'},
    {term:'神の国',reading:'かみのくに',meaning:'神の支配・統治',simple:'神が王として治められること',en:'kingdom of God'},
    {term:'栄光',reading:'えいこう',meaning:'神のすばらしさ・尊さ',simple:'神の偉大さが現れること',en:'glory'},
    {term:'あがない',reading:'あがない',meaning:'代価を払って解放すること',simple:'代価によって自由にすること',en:'redemption'},
    {term:'贖い',reading:'あがない',meaning:'代価を払って解放すること',simple:'代価によって自由にすること',en:'redemption'},
    {term:'戒め',reading:'いましめ',meaning:'守るよう命じられた教え',simple:'神からの大切な命令や教え',en:'commandment'},
    {term:'知恵',reading:'ちえ',meaning:'正しく理解し判断する力',simple:'何がよいかを理解して選ぶ力',en:'wisdom'}
  ].sort((a,b)=>b.term.length-a.term.length);
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const state=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const isJapanese=()=>window.BQTranslations?.selected?.()==='JKO';
  const hira=s=>String(s||'').replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60));
  const hasKanji=s=>/[一-龯々〆ヵヶ]/.test(s||'');

  function addScript(src){return new Promise((resolve,reject)=>{const old=document.querySelector(`script[data-jp-lib="${src}"]`);if(old){if(window.kuromoji)return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}const el=document.createElement('script');el.src=src;el.dataset.jpLib=src;el.onload=resolve;el.onerror=()=>reject(new Error('Japanese reading engine could not load'));document.head.appendChild(el)})}
  async function getTokenizer(){if(tokenizer)return tokenizer;if(!tokenizerPromise){tokenizerPromise=(async()=>{if(!window.kuromoji)await addScript('https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js');return new Promise((resolve,reject)=>window.kuromoji.builder({dicPath:'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/'}).build((err,t)=>{if(err)reject(err);else{tokenizer=t;resolve(t)}}))})()}try{return await tokenizerPromise}catch(e){tokenizerPromise=null;throw e}}

  function supportRuby(text){let html=esc(text),used=[];for(const item of TERMS){if(!text.includes(item.term))continue;const token=`@@BQJP${used.length}@@`;const re=new RegExp(esc(item.term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');if(!re.test(html))continue;html=html.replace(re,token);used.push({token,html:`<ruby>${esc(item.term)}<rt>${esc(item.reading)}</rt></ruby>`})}for(const x of used)html=html.split(x.token).join(x.html);return html}
  async function allRuby(text){const t=await getTokenizer();return t.tokenize(text).map(x=>{const surface=x.surface_form||'',reading=hira(x.reading||'');return hasKanji(surface)&&reading?`<ruby>${esc(surface)}<rt>${esc(reading)}</rt></ruby>`:esc(surface)}).join('')}

  async function renderFurigana(){if(!current.article||!isJapanese())return;const s=state();const paragraphs=[...current.article.querySelectorAll('p[data-verse]')];for(const p of paragraphs){const span=p.querySelector('.verse-text')||p;const original=span.dataset.originalText||span.textContent||'';span.dataset.originalText=original;if(s.furigana==='off')span.textContent=original;else if(s.furigana==='support')span.innerHTML=supportRuby(original);else{span.classList.add('jp-reading-loading');try{span.innerHTML=await allRuby(original)}catch{span.innerHTML=supportRuby(original)}finally{span.classList.remove('jp-reading-loading')}}}}

  function notesFor(text){return TERMS.filter(x=>text.includes(x.term)).slice(0,3)}
  async function fallbackNotes(text){try{const t=await getTokenizer(),seen=new Set();return t.tokenize(text).filter(x=>hasKanji(x.surface_form)&&x.reading).filter(x=>{if(seen.has(x.surface_form))return false;seen.add(x.surface_form);return true}).slice(0,3).map(x=>({term:x.surface_form,reading:hira(x.reading),meaning:'この節で使われている語',simple:'文脈の中で意味を確認しましょう。',en:''}))}catch{return []}}
  async function showVerse(verse,text){if(!current.layer||!isJapanese())return;current.layer.querySelectorAll('.verse-list p.jp-selected').forEach(x=>x.classList.remove('jp-selected'));current.layer.querySelector(`.verse-list p[data-verse="${Number(verse)}"]`)?.classList.add('jp-selected');const host=current.layer.querySelector('[data-jp-notes]');if(!host)return;host.innerHTML='<div class="jp-note-loading">日本語ポイントを確認中…</div>';let notes=notesFor(text);if(!notes.length)notes=await fallbackNotes(text);host.innerHTML=notes.length?notes.map(n=>`<article class="jp-word"><div><b>${esc(n.term)}</b><span>${esc(n.reading)}</span></div><p>${esc(n.simple)}</p><small>${esc(n.meaning)}${n.en?` · ${esc(n.en)}`:''}</small></article>`).join(''):'<p class="jp-empty">この節には追加の語彙メモはありません。本文をそのまま読み進めてください。</p>'}

  function toolbar(){const s=state();return `<section class="jp-study-toolbar" data-jp-toolbar><div><b>🇯🇵 日本語で聖書を学ぶ</b><small>口語訳を選んだ時だけ表示されます</small></div><label>ふりがな<select data-jp-furigana><option value="off" ${s.furigana==='off'?'selected':''}>OFF</option><option value="support" ${s.furigana==='support'?'selected':''}>難しい語だけ</option><option value="all" ${s.furigana==='all'?'selected':''}>すべて</option></select></label><button class="jp-learn-toggle ${s.learning?'active':''}" data-jp-learning>${s.learning?'学習メモ ON':'学習メモ OFF'}</button></section>`}
  function panel(){return `<aside class="jp-study-panel" data-jp-panel><div class="jp-panel-head"><span>あ</span><div><b>日本語ポイント</b><small>節をタップすると語彙・読み方を確認できます</small></div></div><div data-jp-notes><p class="jp-empty">読みたい節をタップしてください。</p></div><div class="jp-disclaimer">ここに表示されるふりがな・現代語の説明・英語の意味は学習補助であり、聖書本文ではありません。</div></aside>`}

  function bind(){const layer=current.layer;if(!layer)return;layer.querySelector('[data-jp-furigana]')?.addEventListener('change',e=>{const s=state();s.furigana=e.target.value;save(s);renderFurigana()});layer.querySelector('[data-jp-learning]')?.addEventListener('click',e=>{const s=state();s.learning=!s.learning;save(s);e.currentTarget.classList.toggle('active',s.learning);e.currentTarget.textContent=s.learning?'学習メモ ON':'学習メモ OFF';layer.querySelector('[data-jp-panel]')?.classList.toggle('jp-hidden',!s.learning)});current.article?.querySelectorAll('p[data-verse]').forEach(p=>p.addEventListener('click',()=>{const span=p.querySelector('.verse-text')||p;showVerse(p.dataset.verse,span.dataset.originalText||span.textContent||'')}))}

  async function enhance(article,layer,rows=[]){if(!article||!layer||!isJapanese())return disable(layer);current={article,layer,rows};const section=layer.querySelector('.reader-chapter');if(!section)return;section.classList.add('jko-active');let tools=section.querySelector('[data-jp-toolbar]');if(!tools){article.insertAdjacentHTML('beforebegin',toolbar());tools=section.querySelector('[data-jp-toolbar]')}let layout=section.querySelector('[data-jp-layout]');if(!layout){layout=document.createElement('div');layout.className='jp-reading-layout';layout.dataset.jpLayout='1';article.before(layout);layout.appendChild(article);layout.insertAdjacentHTML('beforeend',panel())}const s=state();layout.querySelector('[data-jp-panel]')?.classList.toggle('jp-hidden',!s.learning);article.querySelectorAll('p[data-verse]').forEach(p=>{const span=p.querySelector('.verse-text')||p;if(!span.dataset.originalText)span.dataset.originalText=span.textContent||''});bind();await renderFurigana();const first=article.querySelector('p[data-verse]');if(first&&s.learning)showVerse(first.dataset.verse,(first.querySelector('.verse-text')||first).dataset.originalText||'')}

  function disable(layer=document.getElementById('bqReaderLayer')){if(!layer)return;const section=layer.querySelector('.reader-chapter');section?.classList.remove('jko-active');section?.querySelector('[data-jp-toolbar]')?.remove();const layout=section?.querySelector('[data-jp-layout]');if(layout){const article=layout.querySelector('.verse-list');if(article){article.querySelectorAll('.verse-text[data-original-text]').forEach(span=>{span.textContent=span.dataset.originalText;delete span.dataset.originalText});layout.before(article)}layout.remove()}current={article:null,layer:null,rows:[]}}

  window.BQJapaneseLearning={enhance,disable};
})();

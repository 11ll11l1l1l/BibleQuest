(() => {
  const KEY='biblequest_ui_language_v1';
  const getLang=()=>localStorage.getItem(KEY)||'taglish';
  const exact=new Map(Object.entries({
    'Home':'Home','Journey':'Journey','Think':'Think','Me':'Ako','Transform':'Transform',
    'Your Bible journey':'Bible journey mo','Keep growing.':'Tuloy lang sa paglago.','Learn the story, understand the context, connect the ideas.':'Kilalanin ang story, intindihin ang context, at i-connect ang ideas.',
    'Continue learning':'Tuloy ang learning','Loads only what you open':'Kung ano lang ang bubuksan mo, iyon lang ang ilo-load',
    'Daily 5':'Daily 5','Bible Recall Decks':'Bible Recall Decks','Quick Play':'Quick Play','Review Mistakes':'Balikan ang Mali','Context Mode':'Context Mode','Detective':'Bible Detective','Story Adventure':'Story Adventure','Timeline':'Timeline',
    'Wisdom & reflection':'Wisdom at Reflection','Situations & Wisdom':'Situations & Wisdom','Think Deeper':'Mas Malalim na Usapan','Group study':'Group study','Reserved for later':'Para sa future update','Study Together':'Study Together',
    'Lightweight mode active':'Lightweight mode active','Choose a book':'Pumili ng Bible book','Read without the giant download.':'Magbasa nang hindi dina-download ang buong Bible.','CONTINUE READING':'ITULOY ANG PAGBASA','Search Bible books…':'Hanapin ang Bible book…','On demand':'On demand',
    'Bible Reader':'Bible Reader','Opening the Bible shelf…':'Binubuksan ang Bible shelf…','Loading only what this page needs…':'Kung ano lang ang kailangan ng page na ito, iyon lang ang nilo-load…','Cancel':'Cancel','Chapter':'Chapter','Save this passage':'I-save ang passage na ito','Back to books':'Balik sa books',
    'Verse Order':'Ayusin ang Verse','Close-reading game':'Close-reading game','Can you rebuild the passage?':'Kaya mo bang ayusin ulit ang passage?','Choose a Bible book…':'Pumili ng Bible book…','solved':'solved','best streak':'best streak','USE LAST READ BOOK':'GAMITIN ANG HULING BINASA','Check order':'I-check ang order','Change book':'Palit ng book',
    'Open Smart Review':'Smart Review','OPEN BIBLE LIBRARY':'OPEN BIBLE LIBRARY','Building your review…':'Binubuo ang review mo…','NEW OPEN QUESTION':'BAGONG OPEN QUESTION','DUE REVIEW':'DUE NA FOR REVIEW','REINFORCEMENT':'REINFORCEMENT','REFERENCE ANSWER':'SOURCE ANSWER','Review again':'Balikan ulit','Got it':'Gets ko','Reveal answer':'Ipakita ang sagot','OPEN REVIEW COMPLETE':'TAPOS ANG SMART REVIEW','Return to BibleQuest':'Bumalik sa BibleQuest',
    'Open recall library':'Open recall library','Choose one book.':'Pumili ng isang book.','Search Bible books…':'Hanapin ang Bible book…','REFERENCE ANSWER':'SOURCE ANSWER','Review again':'Balikan ulit','Got it':'Gets ko',
    'Learning map':'Learning map','Bible Journey':'Bible Journey','overall explored':'overall explored','core questions encountered':'core questions na nakita','tracked accuracy':'tracked accuracy','due now':'due ngayon','weakest explored area':'pinaka-kailangang balikan',
    'Round complete':'Tapos ang round','Back home':'Balik Home','Play another':'Isa pang round','Next question':'Next question','See results':'Tingnan ang result','Correct':'Tama','Added to review':'Idinagdag sa review'
  }));

  const replacements=[
    [/Learn the story, understand the context, connect the ideas\./g,'Kilalanin ang story, intindihin ang context, at i-connect ang ideas.'],
    [/A balanced mix of recall, context and review\./g,'Balanced mix ng recall, context, at review.'],
    [/Thousands of open study questions, downloaded one Bible book at a time\./g,'Libo-libong open study questions, isang Bible book lang ang dina-download kada bukas.'],
    [/10 mixed questions/g,'10 mixed questions'],[/Builds automatically/g,'Automatic na nabubuo'],[/Why, not just who/g,'Bakit, hindi lang sino'],[/Guess from clues/g,'Hulaan gamit ang clues'],[/Read \+ checkpoint/g,'Magbasa + checkpoint'],[/Put events in order/g,'Ayusin ang events'],
    [/Real-life decisions examined through biblical principles\. Not fake one-answer theology\./g,'Real-life decisions na tinitingnan gamit ang biblical principles—hindi pilit na one-answer theology.'],
    [/Questions about faith, motives, planning, forgiveness and judgment\./g,'Mga tanong tungkol sa faith, motives, planning, forgiveness, at judgment.'],
    [/Only the selected Bible book is fetched\./g,'Selected Bible book lang ang kukunin'],
    [/Answer from memory first\. Then reveal the source answer\./g,'Sagutin muna from memory. Saka i-reveal ang source answer.'],
    [/Rate your recall, not whether the wording matched exactly\./g,'I-rate kung naalala mo ang idea, hindi kung eksaktong pareho ang wording.'],
    [/Weak and overdue open-library questions first\./g,'Unahin ang mahina at due nang questions.'],
    [/Adaptive recall drawn from the open Bible question packs you study\./g,'Adaptive recall mula sa open Bible question packs na pinag-aaralan mo.']
  ];

  const shouldSkip=node=>{
    const p=node.parentElement;
    if(!p) return true;
    if(['SCRIPT','STYLE','TEXTAREA'].includes(p.tagName)) return true;
    return !!p.closest('[data-bq-english],.verse-list,.open-answer,.source-content,[data-bq-scripture],[data-bq-source-content]');
  };

  function translateText(text){
    const trimmed=text.trim();
    if(exact.has(trimmed)) return text.replace(trimmed,exact.get(trimmed));
    let out=text;
    replacements.forEach(([re,to])=>{out=out.replace(re,to)});
    return out;
  }

  function apply(root=document.body){
    if(getLang()!=='taglish' || !root) return;
    if(root.nodeType===1&&root.closest?.('[data-bq-english]'))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{ if(!shouldSkip(n)) { const next=translateText(n.nodeValue); if(next!==n.nodeValue)n.nodeValue=next; } });
    root.querySelectorAll?.('input[placeholder]').forEach(i=>{
      if(i.closest('[data-bq-english]'))return;
      const p=i.getAttribute('placeholder');
      if(p==='Search Bible books…'||p==='Choose a Bible book…')i.setAttribute('placeholder','Hanapin ang Bible book…');
      if(p==='Search Bible books…')i.setAttribute('placeholder','Hanapin ang Bible book…');
    });
  }

  function injectToggle(){
    const host=document.querySelector('.top-actions');
    if(!host||document.querySelector('[data-ui-language]'))return;
    const b=document.createElement('button');
    b.className='ui-language-toggle'; b.dataset.uiLanguage='1';
    b.textContent=getLang()==='taglish'?'Taglish':'EN';
    b.title='Interface language';
    b.onclick=()=>{localStorage.setItem(KEY,getLang()==='taglish'?'en':'taglish');location.reload();};
    host.prepend(b);
  }

  const obs=new MutationObserver(m=>{for(const x of m){x.addedNodes.forEach(n=>{if(n.nodeType===1)apply(n)});} injectToggle();});
  document.addEventListener('DOMContentLoaded',()=>{apply();injectToggle();obs.observe(document.documentElement,{childList:true,subtree:true});});
  setTimeout(()=>{apply();injectToggle();if(!obs.takeRecords){}},100);
})();
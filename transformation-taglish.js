(() => {
  const LANG_KEY = 'biblequest_transform_lang_v1';
  const STORE = 'biblequest_transformation_v1';
  const lang = localStorage.getItem(LANG_KEY) || 'tl';

  const ITEMS = {
    'Am the life of the party.':'Madalas ako ang nagpapasigla ng party o gathering.',
    'Feel comfortable around people.':'Komportable ako kapag maraming tao sa paligid.',
    'Start conversations.':'Ako mismo ang madalas nagsisimula ng conversation.',
    'Talk to a lot of different people at parties.':'Marami akong iba-ibang taong nakakausap sa parties o gatherings.',
    "Don't mind being the center of attention.":'Okay lang sa akin na ako ang center of attention.',
    "Don't talk a lot.":'Hindi ako masyadong madaldal.',
    'Keep in the background.':'Mas gusto kong nasa background lang.',
    'Have little to say.':'Kadalasan, kaunti lang ang gusto kong sabihin.',
    "Don't like to draw attention to myself.":'Ayokong masyadong napupunta sa akin ang attention.',
    'Am quiet around strangers.':'Tahimik ako kapag kasama ang mga taong hindi ko pa kilala.',
    'Am interested in people.':'Interesado akong makilala at maintindihan ang ibang tao.',
    "Sympathize with others' feelings.":'Madali akong makiramay sa nararamdaman ng iba.',
    'Have a soft heart.':'Madali akong maawa at maantig para sa ibang tao.',
    'Take time out for others.':'Naglalaan ako ng oras para tumulong o makinig sa iba.',
    "Feel others' emotions.":'Madali kong maramdaman o mapansin ang emosyon ng ibang tao.',
    'Make people feel at ease.':'Madali kong napapakomportable ang ibang tao.',
    'Am not really interested in others.':'Hindi ako gaanong interesado sa ibang tao.',
    'Insult people.':'Nakakapagsalita ako minsan sa paraang nakaka-insulto sa iba.',
    "Am not interested in other people's problems.":'Hindi ako gaanong interesado sa problema ng ibang tao.',
    'Feel little concern for others.':'Kaunti lang ang concern ko para sa ibang tao.',
    'Am always prepared.':'Kadalasan handa ako bago pa kailanganin ang isang bagay.',
    'Pay attention to details.':'Napapansin at binibigyan ko ng pansin ang mga detalye.',
    'Get chores done right away.':'Ginagawa ko agad ang mga kailangang gawain.',
    'Like order.':'Gusto ko ng maayos at organisadong sistema.',
    'Follow a schedule.':'Sinusunod ko ang schedule o plano ko.',
    'Am exacting in my work.':'Mataas ang standards ko at maingat ako sa trabaho ko.',
    'Leave my belongings around.':'Madalas kong naiiwan kung saan-saan ang mga gamit ko.',
    'Make a mess of things.':'Madalas akong nakakagawa ng kalat o nagugulo ang mga bagay.',
    'Often forget to put things back in their proper place.':'Madalas kong nakakalimutang ibalik ang mga bagay sa tamang lugar.',
    'Shirk my duties.':'May mga pagkakataong iniiwasan o pinapabayaan ko ang responsibilities ko.',
    'Am relaxed most of the time.':'Relaxed o kalmado ako most of the time.',
    'Seldom feel blue.':'Bihira akong malungkot o mabigatan ang pakiramdam.',
    'Get stressed out easily.':'Madali akong ma-stress.',
    'Worry about things.':'Madalas akong mag-worry tungkol sa mga bagay.',
    'Am easily disturbed.':'Madali akong maapektuhan o mabahala.',
    'Get upset easily.':'Madali akong ma-upset.',
    'Change my mood a lot.':'Madalas magbago ang mood ko.',
    'Have frequent mood swings.':'Madalas akong magkaroon ng mood swings.',
    'Get irritated easily.':'Madali akong mairita.',
    'Often feel blue.':'Madalas akong malungkot o mabigatan ang pakiramdam.',
    'Have a rich vocabulary.':'Malawak ang vocabulary ko.',
    'Have a vivid imagination.':'Malinaw at aktibo ang imagination ko.',
    'Have excellent ideas.':'Madalas akong nakakaisip ng magagandang ideas.',
    'Am quick to understand things.':'Mabilis kong naiintindihan ang mga bagong idea o concept.',
    'Use difficult words.':'Gumagamit ako minsan ng mas advanced o mahihirap na salita.',
    'Spend time reflecting on things.':'Naglalaan ako ng oras para mag-reflect at mag-isip nang malalim.',
    'Am full of ideas.':'Marami akong naiisip na ideas.',
    'Have difficulty understanding abstract ideas.':'Nahihirapan akong intindihin ang abstract o hindi konkretong ideas.',
    'Am not interested in abstract ideas.':'Hindi ako gaanong interesado sa abstract ideas.',
    'Do not have a good imagination.':'Hindi gaanong malakas ang imagination ko.'
  };

  const TEXT = {
    'device only':'sa device lang',
    'Know your patterns':'Kilalanin ang patterns mo',
    'Transformation starts with an accurate mirror.':'Ang transformation nagsisimula sa malinaw na pagkilala sa sarili.',
    'Measure normal-range personality traits, test several reasoning biases, then turn the findings into specific practices. High and low trait scores are not moral rankings.':'Sukatin ang normal personality traits mo, i-test ang ilang thinking biases, at gawing practical habits ang findings. Ang mataas o mababang trait score ay hindi sukatan ng pagiging mabuti o masama.',
    'Not a diagnosis.':'Hindi ito diagnosis.',
    'Personality Foundations':'Personality Foundations',
    'Start assessment':'Simulan ang assessment',
    'Your current mirror':'Current self-picture mo',
    'stored only on this device':'naka-save lang sa device na ito',
    'Build my transformation plan':'Gumawa ng transformation plan ko',
    'Describe yourself as you usually are.':'I-describe ang sarili mo kung paano ka kadalasan talaga.',
    'Answer based on your typical behavior over time, not the person you want to be and not only how you felt today.':'Sagutin base sa usual behavior mo over time—hindi sa ideal version ng sarili mo at hindi lang sa nararamdaman mo today.',
    'Response scale:':'Response scale:',
    'Begin assessment':'Simulan ang assessment',
    'Save & leave':'I-save at lumabas',
    'How accurately does each statement describe you?':'Gaano ka-accurate ang statement na ito para i-describe ka?',
    'Very inaccurate':'Hindi talaga ako ito',
    'Moderately inaccurate':'Medyo hindi ako ito',
    'Neither':'Gitna / depende',
    'Moderately accurate':'Medyo ako ito',
    'Very accurate':'Talagang ako ito',
    'Previous':'Bumalik',
    'Calculate results':'Kalkulahin ang results',
    'Your Big Five profile':'Big Five profile mo',
    'Important:':'Importante:',
    'Turn this into a plan':'Gawing action plan',
    'View Bias Lab':'Tingnan ang Bias Lab',
    'Continue to Bias Lab':'Tuloy sa Bias Lab',
    'Retake personality exam':'Ulitin ang personality exam',
    'Method:':'Paraan ng scoring:',
    'Extraversion':'Extraversion / Social Energy',
    'Agreeableness':'Agreeableness / Pakikisama',
    'Conscientiousness':'Conscientiousness / Disiplina at Structure',
    'Emotional Stability':'Emotional Stability',
    'Intellect / Imagination':'Intellect / Imagination',
    'Higher expression':'Mas mataas ang expression',
    'Lower expression':'Mas mababa ang expression',
    'Midrange':'Nasa gitna',
    'Strongest trait signals':'Pinaka-malalakas na trait signals',
    'Personal experiment plan':'Personal experiment plan',
    'Do less, test more.':'Kaunting sabay-sabay na pagbabago; mas maraming tunay na testing.',
    'Biblical integration':'Biblical integration',
    'Psychology describes tendencies; Scripture addresses faithfulness.':'Psychology nagde-describe ng tendencies; Scripture ang tumutulong mag-examine ng faithfulness, motives, wisdom, at character.',
    'Done':'Tapos',
    'More inward, reserved, and selective with social energy.':'Mas inward at reserved ka, at mas pinipili mo kung saan mo gagamitin ang social energy mo.',
    'More outward, energetic, and comfortable initiating social contact.':'Mas outward at energetic ka, at mas komportable kang mag-initiate ng social interaction.',
    'More skeptical, direct, and willing to challenge others.':'Mas direct at skeptical ka, at mas willing kang mag-challenge ng ibang tao o idea.',
    'More compassionate, cooperative, and attentive to other people.':'Mas compassionate at cooperative ka, at natural kang attentive sa needs at feelings ng ibang tao.',
    'More flexible and spontaneous, with less natural pull toward structure.':'Mas flexible at spontaneous ka, at mas kaunti ang natural pull mo toward strict structure at routines.',
    'More organized, persistent, and plan-oriented.':'Mas organized, persistent, at plan-oriented ka.',
    'More emotionally reactive and sensitive to stress or threat.':'Mas mabilis at mas malakas ang emotional reaction mo sa stress, uncertainty, o perceived threat.',
    'More even-tempered and less easily disrupted by stress.':'Mas steady ang mood mo at mas hindi madaling ma-disrupt ng stress.',
    'More concrete, familiar, and practical in interests and thinking.':'Mas concrete, familiar, at practical ang style mo sa interests at pag-iisip.',
    'More drawn to ideas, imagination, reflection, and complexity.':'Mas drawn ka sa ideas, imagination, reflection, at complex concepts.'
  };

  function translate(t) {
    if (!t) return t;
    if (ITEMS[t]) return ITEMS[t];
    if (TEXT[t]) return TEXT[t];
    let m;
    if ((m=t.match(/^Continue \((\d+)\/50 answered\)$/))) return `Ituloy (${m[1]}/50 nasagutan)`;
    if ((m=t.match(/^Completed (.+) · view results$/))) return `Completed ${m[1]} · tingnan ang results`;
    if ((m=t.match(/^(Higher expression|Lower expression|Midrange) · (.+)$/))) return `${TEXT[m[1]]} · ${m[2]}`;
    if (t.startsWith('You reported a mixed or moderate pattern on ')) return 'Mixed o moderate ang pattern mo sa trait na ito; malamang malaki ang epekto ng context sa behavior mo.';
    if (t === 'These bars show where your self-ratings fall on the 1–5 IPIP scale. They are not population percentiles. A higher bar means more expression of that trait on this questionnaire.') return 'Ipinapakita ng bars kung saan bumagsak ang self-ratings mo sa 1–5 IPIP scale. Hindi ito population percentile. Mas mataas na bar = mas malakas ang expression ng trait sa questionnaire na ito.';
    if (t === 'no Big Five trait is automatically virtuous or sinful, strong or weak. The same tendency can help in one setting and create blind spots in another.') return 'walang Big Five trait na automatic na virtue, sin, strength, o weakness. Ang parehong tendency puwedeng makatulong sa isang context at maging blind spot sa iba.';
    if (t === 'This plan targets the strongest signals from your current results. It is not a treatment plan. Pick one or two practices rather than trying to “fix your personality.”') return 'Target ng plan na ito ang strongest signals sa current results mo. Hindi ito treatment plan. Pumili lang ng isa o dalawang practice kaysa subukang “ayusin” ang buong personality mo.';
    if (t === 'BibleQuest should not label introversion, high emotion, low openness, or any other normal trait as sin. Use the psychological result to notice patterns, then examine motives, choices, wisdom, and character separately through Scripture and community.') return 'Hindi dapat tawaging kasalanan ng BibleQuest ang introversion, pagiging emotionally sensitive, low openness, o ibang normal trait. Gamitin ang psych result para mapansin ang patterns; saka hiwalay na suriin ang motives, choices, wisdom, at character gamit ang Scripture at trusted community.';
    return t;
  }

  function walk(root) {
    if (lang !== 'tl' || !root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n => {
      const raw=n.nodeValue;
      const core=raw.trim();
      if (!core) return;
      const out=translate(core);
      if (out!==core) n.nodeValue=raw.replace(core,out);
    });
    root.querySelectorAll?.('[aria-label]').forEach(el => {
      const a=el.getAttribute('aria-label');
      const out=translate(a);
      if(out!==a) el.setAttribute('aria-label',out);
    });
  }

  function addToggle() {
    const top=document.querySelector('.bq-transform-overlay .transform-top');
    if(!top || top.querySelector('.bq-lang-switch')) return;
    const box=document.createElement('div');
    box.className='bq-lang-switch';
    box.innerHTML=`<button class="${lang==='tl'?'active':''}" data-bq-lang="tl">Taglish</button><button class="${lang==='en'?'active':''}" data-bq-lang="en">EN</button>`;
    const chip=top.querySelector('.local-chip');
    top.insertBefore(box,chip||null);
    box.querySelectorAll('[data-bq-lang]').forEach(b=>b.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      localStorage.setItem(LANG_KEY,b.dataset.bqLang);
      location.reload();
    });
  }

  function addTranslationNote() {
    if(lang!=='tl') return;
    const overlay=document.querySelector('.bq-transform-overlay');
    if(!overlay || overlay.querySelector('.bq-translation-note')) return;
    const target=overlay.querySelector('.assessment-intro,.result-heading');
    if(!target || (!overlay.querySelector('.rating-item') && !overlay.querySelector('.trait-results') && !overlay.querySelector('[data-personality-begin]'))) return;
    const note=document.createElement('div');
    note.className='source-note bq-translation-note';
    note.innerHTML='<b>Taglish translation note:</b> Mas natural basahin ang Taglish wording, pero same pa rin ang original IPIP item IDs, reverse keys, factor assignments, at scoring. Ang specific Taglish wording na ito ay convenience translation at hindi pa independently validated bilang hiwalay na Filipino instrument. Gamitin ang EN toggle para makita ang original wording.';
    target.insertAdjacentElement('afterend',note);
  }

  function addQualityCheck() {
    const overlay=document.querySelector('.bq-transform-overlay');
    if(!overlay?.querySelector('.trait-results') || overlay.querySelector('.bq-response-quality')) return;
    let data; try{data=JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return}
    const vals=Object.values(data.personalityAnswers||{}).map(Number).filter(Number.isFinite);
    if(vals.length!==50) return;
    const counts=[1,2,3,4,5].map(v=>vals.filter(x=>x===v).length);
    const unique=counts.filter(Boolean).length, midpoint=counts[2]/50;
    const caution=unique<=2 || midpoint>=.7;
    const card=document.createElement('article');
    card.className='calibration-card bq-response-quality';
    card.innerHTML=`<div><span>🧪</span><div><h3>Response quality check: ${caution?'Interpret with caution':'Okay'}</h3><p>${caution?'Napaka-narrow ng response pattern mo o sobrang daming neutral answers. Posibleng less informative ang profile; consider retaking kapag kaya mong mas i-distinguish ang responses.':'May sapat na spread ang responses mo para maging informative ang profile. Self-report pa rin ito at puwedeng maapektuhan ng mood, self-awareness, at context.'}</p></div></div><small>Simple response-pattern check lang ito, hindi formal validity scale.</small>`;
    overlay.querySelector('.trait-results').insertAdjacentElement('afterend',card);
  }

  function apply(){
    const overlay=document.querySelector('.bq-transform-overlay');
    const tab=document.querySelector('[data-transform-tab]');
    if(tab) walk(tab);
    if(!overlay) return;
    walk(overlay); addToggle(); addTranslationNote(); addQualityCheck();
  }

  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  apply();
})();
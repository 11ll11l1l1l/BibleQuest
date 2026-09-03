(() => {
  const STORE = 'biblequest_transformation_v1';
  const FACTORS = {
    E: { name: 'Extraversion', icon: '🗣️', low: 'More inward, reserved, and selective with social energy.', high: 'More outward, energetic, and comfortable initiating social contact.' },
    A: { name: 'Agreeableness', icon: '🤝', low: 'More skeptical, direct, and willing to challenge others.', high: 'More compassionate, cooperative, and attentive to other people.' },
    C: { name: 'Conscientiousness', icon: '🧭', low: 'More flexible and spontaneous, with less natural pull toward structure.', high: 'More organized, persistent, and plan-oriented.' },
    S: { name: 'Emotional Stability', icon: '🌊', low: 'More emotionally reactive and sensitive to stress or threat.', high: 'More even-tempered and less easily disrupted by stress.' },
    O: { name: 'Intellect / Imagination', icon: '💡', low: 'More concrete, familiar, and practical in interests and thinking.', high: 'More drawn to ideas, imagination, reflection, and complexity.' }
  };

  const RAW_ITEMS = {
    E: [
      ['Am the life of the party.', 1], ['Feel comfortable around people.', 1], ['Start conversations.', 1], ['Talk to a lot of different people at parties.', 1], ["Don't mind being the center of attention.", 1],
      ["Don't talk a lot.", -1], ['Keep in the background.', -1], ['Have little to say.', -1], ["Don't like to draw attention to myself.", -1], ['Am quiet around strangers.', -1]
    ],
    A: [
      ['Am interested in people.', 1], ["Sympathize with others' feelings.", 1], ['Have a soft heart.', 1], ['Take time out for others.', 1], ["Feel others' emotions.", 1], ['Make people feel at ease.', 1],
      ['Am not really interested in others.', -1], ['Insult people.', -1], ["Am not interested in other people's problems.", -1], ['Feel little concern for others.', -1]
    ],
    C: [
      ['Am always prepared.', 1], ['Pay attention to details.', 1], ['Get chores done right away.', 1], ['Like order.', 1], ['Follow a schedule.', 1], ['Am exacting in my work.', 1],
      ['Leave my belongings around.', -1], ['Make a mess of things.', -1], ['Often forget to put things back in their proper place.', -1], ['Shirk my duties.', -1]
    ],
    S: [
      ['Am relaxed most of the time.', 1], ['Seldom feel blue.', 1], ['Get stressed out easily.', -1], ['Worry about things.', -1], ['Am easily disturbed.', -1], ['Get upset easily.', -1], ['Change my mood a lot.', -1], ['Have frequent mood swings.', -1], ['Get irritated easily.', -1], ['Often feel blue.', -1]
    ],
    O: [
      ['Have a rich vocabulary.', 1], ['Have a vivid imagination.', 1], ['Have excellent ideas.', 1], ['Am quick to understand things.', 1], ['Use difficult words.', 1], ['Spend time reflecting on things.', 1], ['Am full of ideas.', 1],
      ['Have difficulty understanding abstract ideas.', -1], ['Am not interested in abstract ideas.', -1], ['Do not have a good imagination.', -1]
    ]
  };

  const ITEMS = [];
  for (let round = 0; round < 10; round++) {
    for (const factor of ['E', 'A', 'C', 'S', 'O']) {
      const [text, key] = RAW_ITEMS[factor][round];
      ITEMS.push({ id: `${factor}${round + 1}`, factor, text, key });
    }
  }

  const BIAS_TASKS = [
    {
      id: 'sunk', title: 'Past cost vs future value', tag: 'Sunk-cost resistance',
      scenario: 'You paid ¥12,000 for a non-refundable course. After the first sessions it is clearly not useful, and attending the remaining Saturdays would prevent you from finishing an important project. What should matter most now?',
      options: ['Finish it because otherwise the ¥12,000 was wasted.', 'Compare the future benefit and cost from today forward.', 'Keep attending mainly because you already told people you would finish.'], correct: 1,
      good: 'You separated money that is already gone from the decision that still remains.',
      learn: 'A sunk cost is a past cost that cannot be recovered. A better decision asks what each option will cost and return from this point onward.'
    },
    {
      id: 'base', title: 'Use the base rate', tag: 'Base-rate use',
      scenario: 'Only 1 in 100 devices is truly defective. A scanner detects 90% of defective devices, but it also falsely flags 10% of good devices. Your device is flagged. Which rough estimate is closest to the chance it is actually defective?',
      options: ['About 8%', 'About 50%', 'About 90%'], correct: 0,
      good: 'You used the rarity of real defects instead of focusing only on the scanner accuracy.',
      learn: 'With a low base rate, false positives can greatly outnumber true positives. Here the posterior probability is roughly 8%.'
    },
    {
      id: 'conjunction', title: 'More detail is not always more likely', tag: 'Conjunction logic',
      scenario: 'Nora enjoys puzzles, volunteers at an animal shelter, and reads about ecology. Which statement must be at least as probable as the other?',
      options: ['Nora works in an office.', 'Nora works in an office and is an environmental activist.'], correct: 0,
      good: 'You kept the logic separate from how representative the description felt.',
      learn: 'A combined event cannot be more probable than one of its component events. Extra detail may feel convincing while making a statement less probable.'
    },
    {
      id: 'confirm', title: 'Try to disprove yourself', tag: 'Confirmation seeking',
      scenario: 'Your group strongly believes a new Bible-study format improves long-term retention. Which next check would teach you the most?',
      options: ['Ask the members who already love the format for testimonials.', 'Compare later recall with similar sessions that did not use the format, and actively look for failures.', 'Collect more examples of people saying the format feels effective.'], correct: 1,
      good: 'You chose a test that can challenge the belief instead of merely collecting support for it.',
      learn: 'Confirmation bias is reduced when you deliberately search for evidence that could prove your current explanation wrong.'
    },
    {
      id: 'belief', title: 'Believable does not mean valid', tag: 'Belief-vs-logic separation',
      scenario: 'All musicians are creative people. Some creative people are night owls. Therefore, some musicians are night owls. Is the conclusion logically guaranteed by those statements?',
      options: ['Yes, it follows logically.', 'No, it may be true but it does not follow necessarily.'], correct: 1,
      good: 'You separated whether a conclusion sounds plausible from whether the premises actually force it.',
      learn: 'Belief bias occurs when the believability of a conclusion interferes with judging the validity of the reasoning.'
    },
    {
      id: 'outcome', title: 'Judge the process, not only the ending', tag: 'Outcome-bias resistance',
      scenario: 'Two leaders make decisions using the same careful process and the same information available at the time. One gets unlucky and the outcome is bad; the other gets lucky and the outcome is good. How should decision quality be judged?',
      options: ['Mostly by the final outcome.', 'Mostly by the quality of the process and information available when the decision was made.', 'The lucky leader clearly made the better decision.'], correct: 1,
      good: 'You distinguished decision quality from luck in the eventual outcome.',
      learn: 'A good process can sometimes produce a bad result, and a weak process can occasionally get lucky.'
    },
    {
      id: 'frame_gain', title: 'Equivalent choices — version A', tag: 'Framing pair',
      scenario: 'A flood-control team must protect 600 homes. Plan A guarantees that 200 homes will be protected. Plan B has a 1/3 chance that all 600 homes will be protected and a 2/3 chance that none will be protected. Which plan do you choose?',
      options: ['Plan A — guaranteed 200 protected', 'Plan B — uncertain all-or-none result'], kind: 'frame', risk: [0, 1]
    },
    {
      id: 'frame_loss', title: 'Equivalent choices — version B', tag: 'Framing pair',
      scenario: 'Now consider the same numbers described differently. Plan C guarantees that 400 of the 600 homes will remain unprotected. Plan D has a 1/3 chance that no homes remain unprotected and a 2/3 chance that all 600 remain unprotected. Which plan do you choose?',
      options: ['Plan C — guaranteed 400 unprotected', 'Plan D — uncertain all-or-none result'], kind: 'frame', risk: [0, 1]
    }
  ];

  const CAL_TASKS = [
    { id: 'cal1', q: 'Which has the larger land area?', options: ['Australia', 'Greenland'], answer: 0 },
    { id: 'cal2', q: 'Which was built earlier?', options: ['The Great Pyramid of Giza', 'The Colosseum'], answer: 0 },
    { id: 'cal3', q: "Which gas is most abundant in Earth's atmosphere?", options: ['Oxygen', 'Nitrogen'], answer: 1 },
    { id: 'cal4', q: 'Who usually has more bones?', options: ['A newborn baby', 'An adult human'], answer: 0 },
    { id: 'cal5', q: 'Which planet has the shorter year?', options: ['Mercury', 'Venus'], answer: 0 },
    { id: 'cal6', q: 'English belongs primarily to which language family?', options: ['Germanic', 'Romance'], answer: 0 }
  ];

  const LABELS = ['Very inaccurate', 'Moderately inaccurate', 'Neither', 'Moderately accurate', 'Very accurate'];
  let memory = load();
  let overlay = null;
  let personalityPage = 0;
  let biasStep = 0;
  let calibrationStep = 0;
  let currentCalibrationChoice = null;

  function load() {
    try {
      return { personalityAnswers: {}, personalityResult: null, biasAnswers: {}, calibration: {}, biasResult: null, history: [], ...JSON.parse(localStorage.getItem(STORE) || '{}') };
    } catch {
      return { personalityAnswers: {}, personalityResult: null, biasAnswers: {}, calibration: {}, biasResult: null, history: [] };
    }
  }
  function save() { localStorage.setItem(STORE, JSON.stringify(memory)); }
  function esc(s = '') { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
  function nowDate() { return new Date().toISOString().slice(0, 10); }

  function ensureTab() {
    const nav = document.querySelector('.bottom');
    if (!nav || nav.querySelector('[data-transform-tab]')) return;
    const btn = document.createElement('button');
    btn.className = 'navbtn';
    btn.dataset.transformTab = '1';
    btn.innerHTML = '<b>🪞</b>Transform';
    const profile = [...nav.querySelectorAll('.navbtn')].find(x => x.dataset.route === 'profile');
    nav.insertBefore(btn, profile || null);
    btn.onclick = openHub;
    setActive();
  }

  function setActive() {
    const nav = document.querySelector('.bottom');
    if (!nav) return;
    nav.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', !!overlay && b.dataset.transformTab === '1'));
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('section');
    overlay.className = 'bq-transform-overlay';
    overlay.setAttribute('aria-live', 'polite');
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeOverlay() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  function wrap(content) {
    return `<div class="transform-app"><header class="transform-top"><button class="transform-brand" data-transform-home>BibleQuest <span>Transformation</span></button><span class="local-chip">🔒 device only</span></header>${content}</div>`;
  }

  function openHub() {
    ensureOverlay();
    setActive();
    const p = memory.personalityResult;
    const b = memory.biasResult;
    overlay.innerHTML = wrap(`<section class="transform-hero"><div><div class="eyebrow">Know your patterns</div><h1>Transformation starts with an accurate mirror.</h1><p>Measure normal-range personality traits, test several reasoning biases, then turn the findings into specific practices. High and low trait scores are not moral rankings.</p></div><div class="mirror">🪞</div></section>
      <div class="transform-warning"><b>Not a diagnosis.</b> The personality section uses the public-domain IPIP Big-Five Factor Markers. The Bias Lab uses short behavioral tasks inspired by cognitive-bias research; individual bias tasks are noisy and should be treated as signals, not clinical labels.</div>
      <div class="transform-grid">
        <button class="transform-card" data-open-personality><span class="ticon">🧬</span><span><small>~8 MIN · 50 ITEMS</small><b>Personality Foundations</b><p>Extraversion, Agreeableness, Conscientiousness, Emotional Stability, and Intellect / Imagination.</p>${p ? `<em>Completed ${esc(p.date)} · view results</em>` : '<em>Start assessment</em>'}</span><i>›</i></button>
        <button class="transform-card" data-open-bias><span class="ticon">🧠</span><span><small>~6 MIN · BEHAVIORAL TASKS</small><b>Cognitive Bias Lab</b><p>Test sunk cost, base-rate use, conjunction logic, confirmation seeking, framing, outcome bias, and confidence calibration.</p>${b ? `<em>Completed ${esc(b.date)} · view results</em>` : '<em>Start bias lab</em>'}</span><i>›</i></button>
      </div>
      ${(p || b) ? `<section class="transform-summary"><div class="section-title"><h2>Your current mirror</h2><small>stored only on this device</small></div>${p ? miniTraitSummary(p) : ''}${b ? miniBiasSummary(b) : ''}<button class="primary" data-open-plan>Build my transformation plan</button></section>` : ''}
      <section class="method-card"><div class="eyebrow">The loop</div><div class="loop"><span><b>1</b>Observe</span><span><b>2</b>Test</span><span><b>3</b>Practice</span><span><b>4</b>Re-test</span></div><p>A personality result describes tendencies, not destiny. The useful question is not “What type am I?” but “Which patterns help me, which patterns distort my judgment, and what practice will I test next?”</p></section>
      <div class="source-note"><b>Assessment source:</b> International Personality Item Pool (IPIP) Big-Five Factor Markers, public domain. Standard IPIP reverse-key scoring is used. Bias results are an educational behavioral snapshot rather than a standardized diagnostic score.</div>`);
    bindOverlay();
  }

  function openPersonality() {
    ensureOverlay();
    if (memory.personalityResult) return showPersonalityResults();
    const answered = Object.keys(memory.personalityAnswers || {}).length;
    personalityPage = Math.min(9, Math.floor(answered / 5));
    showPersonalityIntro(answered);
  }

  function showPersonalityIntro(answered = 0) {
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Transformation</button><section class="assessment-intro"><div class="assessment-icon">🧬</div><div class="eyebrow">IPIP Big Five · 50 items</div><h1>Describe yourself as you usually are.</h1><p>Answer based on your typical behavior over time, not the person you want to be and not only how you felt today.</p><div class="source-note"><b>Response scale:</b> Very inaccurate → Very accurate. Negative-keyed items are reverse-scored using the official IPIP method. Results are trait scores on this questionnaire, not clinical diagnoses or population percentiles.</div><div class="actions"><button class="primary" data-personality-begin>${answered ? `Continue (${answered}/50 answered)` : 'Begin assessment'}</button>${answered ? '<button class="secondary" data-personality-restart>Restart</button>' : ''}</div></section>`);
    bindOverlay();
  }

  function showPersonalityPage(page = personalityPage) {
    personalityPage = Math.max(0, Math.min(9, page));
    const chunk = ITEMS.slice(personalityPage * 5, personalityPage * 5 + 5);
    const complete = chunk.every(item => memory.personalityAnswers[item.id]);
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Save & leave</button><section class="assessment-head"><div><div class="eyebrow">Personality Foundations</div><h2>Page ${personalityPage + 1} of 10</h2></div><b>${Object.keys(memory.personalityAnswers).length}/50</b></section><div class="assessment-progress"><i style="width:${Object.keys(memory.personalityAnswers).length / 50 * 100}%"></i></div><p class="assessment-instruction">How accurately does each statement describe you?</p><section class="item-stack">${chunk.map(item => ratingItem(item)).join('')}</section><div class="assessment-nav"><button class="secondary" data-personality-prev ${personalityPage === 0 ? 'disabled' : ''}>← Previous</button><button class="primary" data-personality-next ${complete ? '' : 'disabled'}>${personalityPage === 9 ? 'Calculate results' : 'Next →'}</button></div>`);
    bindOverlay();
  }

  function ratingItem(item) {
    const chosen = memory.personalityAnswers[item.id];
    return `<article class="rating-item"><h3>${esc(item.text)}</h3><div class="rating-scale">${[1,2,3,4,5].map(v => `<button aria-label="${LABELS[v-1]}" class="rating-btn ${chosen === v ? 'selected' : ''}" data-rate-item="${item.id}" data-rate-value="${v}">${v}</button>`).join('')}</div><div class="rating-labels"><span>Very inaccurate</span><span>Very accurate</span></div></article>`;
  }

  function ratePersonality(id, value) {
    memory.personalityAnswers[id] = value;
    save();
    showPersonalityPage(personalityPage);
  }

  function scorePersonality() {
    if (ITEMS.some(i => !memory.personalityAnswers[i.id])) return;
    const scores = {};
    for (const factor of Object.keys(FACTORS)) {
      const items = ITEMS.filter(i => i.factor === factor);
      const values = items.map(i => i.key === 1 ? memory.personalityAnswers[i.id] : 6 - memory.personalityAnswers[i.id]);
      const raw = values.reduce((a,b) => a+b, 0);
      const mean = raw / values.length;
      scores[factor] = { raw, mean: +mean.toFixed(2), index: Math.round((mean - 1) / 4 * 100), band: mean < 2.6 ? 'Lower expression' : mean > 3.4 ? 'Higher expression' : 'Midrange' };
    }
    const result = { date: nowDate(), scores };
    memory.personalityResult = result;
    memory.history = [...(memory.history || []), { type: 'personality', date: result.date, scores }].slice(-8);
    save();
    showPersonalityResults();
  }

  function showPersonalityResults() {
    const r = memory.personalityResult;
    if (!r) return openPersonality();
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Transformation</button><section class="result-heading"><div class="eyebrow">Personality Foundations</div><h1>Your Big Five profile</h1><p>These bars show where your self-ratings fall on the 1–5 IPIP scale. They are <b>not population percentiles</b>. A higher bar means more expression of that trait on this questionnaire.</p></section><section class="trait-results">${Object.entries(r.scores).map(([k,s]) => traitResult(k,s)).join('')}</section><div class="transform-warning"><b>Important:</b> no Big Five trait is automatically virtuous or sinful, strong or weak. The same tendency can help in one setting and create blind spots in another.</div><div class="actions"><button class="primary" data-open-plan>Turn this into a plan</button><button class="secondary" data-open-bias>${memory.biasResult ? 'View Bias Lab' : 'Continue to Bias Lab'}</button><button class="secondary" data-personality-restart>Retake personality exam</button></div><div class="source-note"><b>Method:</b> 10 items per factor. +keyed responses score 1→5; −keyed responses are reversed 5→1, then summed. IPIP reports internal-consistency alpha values of approximately .79–.87 for these 10-item factor-marker scales.</div></section>`);
    bindOverlay();
  }

  function traitResult(k, s) {
    const f = FACTORS[k];
    const interpretation = s.band === 'Higher expression' ? f.high : s.band === 'Lower expression' ? f.low : `You reported a mixed or moderate pattern on ${f.name.toLowerCase()}, with behavior likely depending strongly on context.`;
    return `<article class="trait-card"><div class="trait-title"><span>${f.icon}</span><div><h3>${f.name}</h3><small>${s.band} · ${s.mean}/5 · raw ${s.raw}/50</small></div><b>${s.index}</b></div><div class="trait-bar"><i style="width:${s.index}%"></i></div><p>${esc(interpretation)}</p></article>`;
  }

  function openBias() {
    ensureOverlay();
    if (memory.biasResult) return showBiasResults();
    biasStep = Math.min(BIAS_TASKS.length, Object.keys(memory.biasAnswers || {}).length);
    calibrationStep = Object.keys(memory.calibration || {}).length;
    showBiasIntro();
  }

  function showBiasIntro() {
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Transformation</button><section class="assessment-intro"><div class="assessment-icon">🧠</div><div class="eyebrow">Cognitive Bias Lab</div><h1>Do not answer how a “rational person” should answer.</h1><p>Choose what you would actually choose on first reading. The lab uses several short reasoning tasks plus confidence calibration. It is intentionally separate from the Big Five because cognitive-bias tasks are not personality traits.</p><div class="source-note"><b>Scientific caution:</b> research finds individual cognitive-bias tasks can have limited reliability. BibleQuest therefore reports task-level signals and a calibration snapshot, not a permanent “bias type.”</div><button class="primary" data-bias-begin>${Object.keys(memory.biasAnswers || {}).length || Object.keys(memory.calibration || {}).length ? 'Continue lab' : 'Begin Bias Lab'}</button></section>`);
    bindOverlay();
  }

  function showBiasTask(index = biasStep) {
    biasStep = index;
    if (biasStep >= BIAS_TASKS.length) return showCalibrationTask(calibrationStep);
    const task = BIAS_TASKS[biasStep];
    const chosen = memory.biasAnswers[task.id];
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Save & leave</button><section class="assessment-head"><div><div class="eyebrow">Bias Lab · reasoning</div><h2>${esc(task.title)}</h2></div><b>${biasStep + 1}/${BIAS_TASKS.length + CAL_TASKS.length}</b></section><div class="assessment-progress"><i style="width:${biasStep / (BIAS_TASKS.length + CAL_TASKS.length) * 100}%"></i></div><section class="bias-question"><span class="bias-tag">${esc(task.tag)}</span><p>${esc(task.scenario)}</p><div class="bias-options">${task.options.map((o,i) => `<button class="bias-option ${chosen === i ? 'selected' : ''}" data-bias-choice="${i}">${esc(o)}</button>`).join('')}</div>${chosen !== undefined ? `<div class="assessment-nav"><button class="primary" data-bias-next>Lock answer & continue</button></div>` : ''}</section>`);
    bindOverlay();
  }

  function chooseBias(i) {
    const task = BIAS_TASKS[biasStep];
    memory.biasAnswers[task.id] = i;
    save();
    showBiasTask(biasStep);
  }

  function showCalibrationTask(index = calibrationStep) {
    calibrationStep = index;
    if (calibrationStep >= CAL_TASKS.length) return scoreBias();
    currentCalibrationChoice = memory.calibration[CAL_TASKS[calibrationStep].id]?.choice ?? null;
    const task = CAL_TASKS[calibrationStep];
    const saved = memory.calibration[task.id];
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Save & leave</button><section class="assessment-head"><div><div class="eyebrow">Bias Lab · confidence calibration</div><h2>How sure are you?</h2></div><b>${BIAS_TASKS.length + calibrationStep + 1}/${BIAS_TASKS.length + CAL_TASKS.length}</b></section><div class="assessment-progress"><i style="width:${(BIAS_TASKS.length + calibrationStep) / (BIAS_TASKS.length + CAL_TASKS.length) * 100}%"></i></div><section class="bias-question"><span class="bias-tag">Calibration snapshot ${calibrationStep + 1}/${CAL_TASKS.length}</span><h2>${esc(task.q)}</h2><div class="bias-options">${task.options.map((o,i) => `<button class="bias-option ${currentCalibrationChoice === i ? 'selected' : ''}" data-cal-choice="${i}">${esc(o)}</button>`).join('')}</div>${currentCalibrationChoice !== null ? `<div class="confidence-box"><b>How confident are you that your answer is correct?</b><div class="confidence-row">${[50,60,70,80,90,100].map(v => `<button class="confidence-btn ${saved?.confidence === v ? 'selected' : ''}" data-confidence="${v}">${v}%</button>`).join('')}</div></div>` : ''}</section>`);
    bindOverlay();
  }

  function chooseCalibration(choice) {
    currentCalibrationChoice = choice;
    const task = CAL_TASKS[calibrationStep];
    memory.calibration[task.id] = { ...(memory.calibration[task.id] || {}), choice };
    save();
    showCalibrationTask(calibrationStep);
  }

  function chooseConfidence(confidence) {
    const task = CAL_TASKS[calibrationStep];
    memory.calibration[task.id] = { ...(memory.calibration[task.id] || {}), choice: currentCalibrationChoice, confidence };
    save();
    calibrationStep++;
    currentCalibrationChoice = null;
    showCalibrationTask(calibrationStep);
  }

  function scoreBias() {
    if (BIAS_TASKS.some(t => memory.biasAnswers[t.id] === undefined) || CAL_TASKS.some(t => !memory.calibration[t.id]?.confidence)) return showBiasIntro();
    const binary = {};
    BIAS_TASKS.filter(t => typeof t.correct === 'number').forEach(t => binary[t.id] = memory.biasAnswers[t.id] === t.correct ? 1 : 0);
    const gainRisk = BIAS_TASKS.find(t => t.id === 'frame_gain').risk[memory.biasAnswers.frame_gain];
    const lossRisk = BIAS_TASKS.find(t => t.id === 'frame_loss').risk[memory.biasAnswers.frame_loss];
    const frameStable = gainRisk === lossRisk ? 1 : 0;
    const calRows = CAL_TASKS.map(t => ({ correct: memory.calibration[t.id].choice === t.answer, confidence: memory.calibration[t.id].confidence }));
    const accuracy = Math.round(calRows.filter(x => x.correct).length / calRows.length * 100);
    const meanConfidence = Math.round(calRows.reduce((n,x) => n + x.confidence, 0) / calRows.length);
    const gap = meanConfidence - accuracy;
    const resistance = Math.round((Object.values(binary).reduce((a,b) => a+b, 0) + frameStable) / (Object.keys(binary).length + 1) * 100);
    memory.biasResult = { date: nowDate(), binary, frameStable, accuracy, meanConfidence, gap, resistance };
    memory.history = [...(memory.history || []), { type: 'bias', date: memory.biasResult.date, resistance, gap }].slice(-8);
    save();
    showBiasResults();
  }

  function showBiasResults() {
    const r = memory.biasResult;
    if (!r) return openBias();
    const signalRows = [
      ['sunk', 'Sunk-cost resistance'], ['base', 'Base-rate use'], ['conjunction', 'Conjunction logic'], ['confirm', 'Confirmation challenge'], ['belief', 'Belief-vs-logic separation'], ['outcome', 'Outcome/process separation']
    ];
    const calLabel = r.gap > 10 ? 'Overconfidence signal' : r.gap < -10 ? 'Underconfidence signal' : 'Reasonably calibrated snapshot';
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Transformation</button><section class="result-heading"><div class="eyebrow">Cognitive Bias Lab</div><h1>Your reasoning snapshot</h1><p>This is intentionally task-specific. One miss does not mean you “have” a bias in every setting; one correct answer does not make you immune to it.</p></section><div class="bias-score"><div><b>${r.resistance}%</b><span>bias-resistant choices on these tasks</span></div><div><b>${r.accuracy}%</b><span>knowledge accuracy</span></div><div><b>${r.meanConfidence}%</b><span>mean confidence</span></div></div><section class="signal-list">${signalRows.map(([id,name]) => signalRow(name, !!r.binary[id])).join('')}${signalRow('Framing consistency', !!r.frameStable)}</section><article class="calibration-card"><div><span>🎯</span><div><h3>${calLabel}</h3><p>Your mean confidence was ${r.meanConfidence}% while accuracy was ${r.accuracy}%, a ${Math.abs(r.gap)}-point ${r.gap >= 0 ? 'confidence-over-accuracy' : 'accuracy-over-confidence'} gap.</p></div></div><small>Six questions are only a snapshot. Calibration becomes more meaningful across many judgments over time.</small></article><div class="actions"><button class="primary" data-open-plan>Build my transformation plan</button><button class="secondary" data-bias-restart>Retake Bias Lab</button></div>`);
    bindOverlay();
  }

  function signalRow(name, strong) {
    return `<div class="signal-row"><span>${strong ? '✓' : '!'}</span><div><b>${esc(name)}</b><small>${strong ? 'No bias signal on this task' : 'Bias signal appeared on this task — worth testing again in real decisions'}</small></div></div>`;
  }

  function miniTraitSummary(r) {
    const sorted = Object.entries(r.scores).sort((a,b) => Math.abs(b[1].mean - 3) - Math.abs(a[1].mean - 3)).slice(0,2);
    return `<div class="mini-result"><span>🧬</span><div><b>Strongest trait signals</b><p>${sorted.map(([k,s]) => `${FACTORS[k].name}: ${s.band.toLowerCase()}`).join(' · ')}</p></div></div>`;
  }
  function miniBiasSummary(r) {
    return `<div class="mini-result"><span>🧠</span><div><b>Bias snapshot</b><p>${r.resistance}% resistant choices · confidence gap ${r.gap > 0 ? '+' : ''}${r.gap} points</p></div></div>`;
  }

  function openPlan() {
    ensureOverlay();
    const p = memory.personalityResult;
    const b = memory.biasResult;
    if (!p && !b) return openHub();
    const practices = [];
    if (p) {
      const s = p.scores;
      if (s.C.mean < 2.6) practices.push(['🧭', 'Structure one recurring behavior', 'Choose one small implementation rule: “After I ___, I will ___.” Use a visible checklist for two weeks before judging whether you are “disciplined.”']);
      if (s.C.mean > 3.4) practices.push(['🪶', 'Practice flexible standards', 'Before polishing a low-stakes task, define what “good enough” means. Watch whether conscientiousness becomes rigidity or perfectionism.']);
      if (s.A.mean > 3.4) practices.push(['🛡️', 'Add a boundary before saying yes', 'When a request matters, delay your answer long enough to ask: Is this loving, sustainable, and actually mine to carry?']);
      if (s.A.mean < 2.6) practices.push(['🤝', 'Steelman before disagreeing', 'Before challenging someone, state their strongest argument in a way they would accept. Then give your disagreement.']);
      if (s.E.mean > 3.4) practices.push(['🔇', 'Create a quiet decision window', 'For important choices, write your judgment before discussing it with a group. This helps separate your view from social momentum.']);
      if (s.E.mean < 2.6) practices.push(['🗣️', 'Schedule deliberate connection', 'Do not treat introversion as a defect. Instead choose a small, predictable rhythm for initiating one meaningful conversation.']);
      if (s.S.mean < 2.6) practices.push(['🌊', 'Delay major decisions under high arousal', 'When stress spikes, write the decision, evidence, and alternatives. Revisit after sleep or a calm interval before acting when possible.']);
      if (s.S.mean > 3.4) practices.push(['🚨', 'Check for under-reaction', 'Calmness is useful, but ask whether you are discounting legitimate urgency, grief, or another person’s distress because you personally feel steady.']);
      if (s.O.mean > 3.4) practices.push(['🧪', 'Force ideas to meet evidence', 'For an exciting new idea, write one prediction that would fail if the idea is wrong and one practical test you can run cheaply.']);
      if (s.O.mean < 2.6) practices.push(['💡', 'Sample one unfamiliar perspective', 'Once a week, read or hear the strongest version of a view outside your usual preference before deciding it has nothing useful to offer.']);
    }
    if (b) {
      if (!b.binary.sunk) practices.push(['💸', 'Use the “from today forward” rule', 'When tempted to continue because you already spent money or time, hide the past cost and compare only future costs, future benefits, and alternatives.']);
      if (!b.binary.confirm) practices.push(['🔎', 'Assign a disconfirmation question', 'For a belief you care about, write: “What evidence would make me change my mind?” Then deliberately search for that evidence.']);
      if (!b.binary.base) practices.push(['📊', 'Ask for the base rate first', 'Before reacting to a vivid case, ask how common the event is in the relevant population before considering the case-specific evidence.']);
      if (!b.frameStable) practices.push(['🖼️', 'Reframe important choices twice', 'Write the same decision once in gains and once in losses. If your preference changes, inspect why before committing.']);
      if (b.gap > 10) practices.push(['🎯', 'Calibrate confidence numerically', 'For predictions, write a confidence percentage. Later score what happened. Aim to make 70% confidence statements correct about 70% of the time.']);
      if (b.gap < -10) practices.push(['📈', 'Track when you are right', 'Underconfidence can also distort decisions. Record correct judgments and the evidence you used so confidence can become better matched to performance.']);
    }
    const chosen = practices.slice(0,5);
    overlay.innerHTML = wrap(`<button class="transform-back" data-transform-home>← Transformation</button><section class="result-heading"><div class="eyebrow">Personal experiment plan</div><h1>Do less, test more.</h1><p>This plan targets the strongest signals from your current results. It is not a treatment plan. Pick one or two practices rather than trying to “fix your personality.”</p></section><section class="practice-list">${chosen.map(([icon,title,body],i) => `<article class="practice-card"><span>${icon}</span><div><small>EXPERIMENT ${i+1}</small><h3>${esc(title)}</h3><p>${esc(body)}</p></div></article>`).join('') || '<div class="source-note">Your current profile is mostly midrange and the Bias Lab showed few signals. Use the results as a baseline and re-test after meaningful life or habit changes rather than forcing a problem to exist.</div>'}</section><section class="faith-boundary"><div class="eyebrow">Biblical integration</div><h3>Psychology describes tendencies; Scripture addresses faithfulness.</h3><p>BibleQuest should not label introversion, high emotion, low openness, or any other normal trait as sin. Use the psychological result to notice patterns, then examine motives, choices, wisdom, and character separately through Scripture and community.</p></section><div class="actions"><button class="primary" data-transform-home>Done</button></div>`);
    bindOverlay();
  }

  function restartPersonality() {
    if (!confirm('Clear the current personality assessment and retake all 50 items?')) return;
    memory.personalityAnswers = {};
    memory.personalityResult = null;
    save();
    personalityPage = 0;
    showPersonalityIntro(0);
  }
  function restartBias() {
    if (!confirm('Clear the current Bias Lab and retake the tasks?')) return;
    memory.biasAnswers = {};
    memory.calibration = {};
    memory.biasResult = null;
    save();
    biasStep = 0;
    calibrationStep = 0;
    showBiasIntro();
  }

  function bindOverlay() {
    if (!overlay) return;
    overlay.querySelectorAll('[data-transform-home]').forEach(b => b.onclick = openHub);
    overlay.querySelectorAll('[data-open-personality]').forEach(b => b.onclick = openPersonality);
    overlay.querySelectorAll('[data-open-bias]').forEach(b => b.onclick = openBias);
    overlay.querySelectorAll('[data-open-plan]').forEach(b => b.onclick = openPlan);
    overlay.querySelectorAll('[data-personality-begin]').forEach(b => b.onclick = () => showPersonalityPage(personalityPage));
    overlay.querySelectorAll('[data-personality-restart]').forEach(b => b.onclick = restartPersonality);
    overlay.querySelectorAll('[data-rate-item]').forEach(b => b.onclick = () => ratePersonality(b.dataset.rateItem, +b.dataset.rateValue));
    overlay.querySelectorAll('[data-personality-prev]').forEach(b => b.onclick = () => showPersonalityPage(personalityPage - 1));
    overlay.querySelectorAll('[data-personality-next]').forEach(b => b.onclick = () => personalityPage === 9 ? scorePersonality() : showPersonalityPage(personalityPage + 1));
    overlay.querySelectorAll('[data-bias-begin]').forEach(b => b.onclick = () => biasStep < BIAS_TASKS.length ? showBiasTask(biasStep) : showCalibrationTask(calibrationStep));
    overlay.querySelectorAll('[data-bias-choice]').forEach(b => b.onclick = () => chooseBias(+b.dataset.biasChoice));
    overlay.querySelectorAll('[data-bias-next]').forEach(b => b.onclick = () => showBiasTask(biasStep + 1));
    overlay.querySelectorAll('[data-cal-choice]').forEach(b => b.onclick = () => chooseCalibration(+b.dataset.calChoice));
    overlay.querySelectorAll('[data-confidence]').forEach(b => b.onclick = () => chooseConfidence(+b.dataset.confidence));
    overlay.querySelectorAll('[data-bias-restart]').forEach(b => b.onclick = restartBias);
  }

  document.addEventListener('click', e => {
    const routeBtn = e.target.closest('[data-route]');
    if (routeBtn && overlay) closeOverlay();
  }, true);

  const observer = new MutationObserver(() => ensureTab());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  ensureTab();
  window.BQ_TRANSFORMATION = { open: openHub };
})();
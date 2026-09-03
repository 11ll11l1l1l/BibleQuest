(() => {
  const $ = (s, e = document) => e.querySelector(s);
  const $$ = (s, e = document) => [...e.querySelectorAll(s)];
  const STORE = 'biblequest_state_v4';
  const today = () => new Date().toISOString().slice(0, 10);

  const defaults = {
    xp: 0,
    streak: 1,
    lastDay: null,
    answered: 0,
    correct: 0,
    seen: [],
    wrong: [],
    situations: 0,
    achievements: [],
    dailyDone: null,
    rounds: 0,
    mastery: { Genesis: 0, Exodus: 0, History: 0, Wisdom: 0, Prophets: 0, Gospels: 0, Acts: 0, Letters: 0 },
    deckReview: {},
    deckStats: {},
    polls: {},
    settings: { sound: false },
    profile: { name: '' }
  };

  let state = load();
  let view = 'home';
  let game = null;
  let packManifest = null;
  const loadedScripts = new Set();
  const jsonCache = new Map();

  function merge(a, b) {
    const out = { ...a, ...b };
    out.mastery = { ...a.mastery, ...(b.mastery || {}) };
    out.settings = { ...a.settings, ...(b.settings || {}) };
    out.profile = { ...a.profile, ...(b.profile || {}) };
    out.deckReview = { ...a.deckReview, ...(b.deckReview || {}) };
    out.deckStats = { ...a.deckStats, ...(b.deckStats || {}) };
    out.polls = { ...a.polls, ...(b.polls || {}) };
    return out;
  }

  function load() {
    try {
      const current = JSON.parse(localStorage.getItem(STORE) || '{}');
      const older = JSON.parse(localStorage.getItem('biblequest_state_v3') || '{}');
      return merge(defaults, Object.keys(current).length ? current : older);
    } catch {
      return structuredClone(defaults);
    }
  }

  function save() {
    checkAchievements();
    localStorage.setItem(STORE, JSON.stringify(state));
  }

  function checkDay() {
    if (state.lastDay === today()) return;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
    state.lastDay = today();
    save();
  }

  function checkAchievements() {
    const next = [];
    if (state.answered >= 1) next.push('first');
    if (state.correct >= 10) next.push('ten');
    if (state.correct >= 25) next.push('twentyfive');
    if (state.xp >= 250) next.push('xp250');
    if (state.situations >= 3) next.push('wisdom3');
    if ((state.rounds || 0) >= 5) next.push('round5');
    if (Object.values(state.mastery || {}).some(v => v >= 50)) next.push('master50');
    if (Object.values(state.deckStats || {}).some(v => (v.seen || 0) >= 20)) next.push('deck20');
    state.achievements = [...new Set([...(state.achievements || []), ...next])];
  }

  function route(v, payload = null) {
    view = v;
    game = payload;
    render();
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function esc(s = '') {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function category(book = '') {
    if (book === 'Genesis') return 'Genesis';
    if (['Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'].includes(book)) return 'Exodus';
    if (['Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'].includes(book)) return 'History';
    if (['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Songs'].includes(book)) return 'Wisdom';
    if (['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'].includes(book)) return 'Prophets';
    if (['Matthew', 'Mark', 'Luke', 'John'].includes(book)) return 'Gospels';
    if (book === 'Acts') return 'Acts';
    return 'Letters';
  }

  function bumpMastery(book, strong = true) {
    const key = category(book);
    state.mastery[key] = Math.min(100, (state.mastery[key] || 0) + (strong ? 5 : 2));
  }

  function accuracy() { return state.answered ? Math.round(state.correct / state.answered * 100) : 0; }
  function level() { return Math.max(1, Math.floor(state.xp / 120) + 1); }
  function xpIntoLevel() { return state.xp % 120; }

  function shell(content) {
    return `<main class="app">
      <header class="topbar">
        <button class="brand brand-btn" data-route="home">Bible<span>Quest</span></button>
        <div class="top-actions"><span class="level-chip">Lv ${level()}</span><span class="streak">🔥 ${state.streak}</span></div>
      </header>
      ${content}
    </main>${nav()}`;
  }

  function nav() {
    return `<nav class="bottom">
      <button class="navbtn ${view === 'home' ? 'active' : ''}" data-route="home"><b>🏡</b>Home</button>
      <button class="navbtn ${view === 'journey' ? 'active' : ''}" data-route="journey"><b>🗺️</b>Journey</button>
      <button class="navbtn ${view.startsWith('discuss') ? 'active' : ''}" data-route="discuss"><b>💭</b>Think</button>
      <button class="navbtn ${view === 'profile' ? 'active' : ''}" data-route="profile"><b>🌱</b>Me</button>
    </nav>`;
  }

  function home() {
    const dailyDone = state.dailyDone === today();
    const name = state.profile.name ? `, ${esc(state.profile.name)}` : '';
    const deckReviewCount = Object.values(state.deckReview || {}).reduce((n, ids) => n + ids.length, 0);
    return shell(`
      <section class="hero">
        <div class="hero-copy">
          <div class="eyebrow">Your Bible journey</div>
          <h1>Keep growing${name}.</h1>
          <p>Learn the story, understand the context, connect the ideas.</p>
          <div class="level-row"><div class="progress"><i style="width:${Math.round(xpIntoLevel() / 120 * 100)}%"></i></div><small>${xpIntoLevel()}/120 XP to next level</small></div>
        </div>
        <div class="mascot" aria-hidden="true">🐑</div>
      </section>
      <section class="quick-stats"><div><b>${state.xp}</b><span>XP</span></div><div><b>${accuracy()}%</b><span>Accuracy</span></div><div><b>${state.wrong.length + deckReviewCount}</b><span>Review</span></div></section>

      <div class="section-title"><h2>Continue learning</h2><small>Loads only what you open</small></div>
      <section class="feature-stack">
        <button class="quest-card daily" data-action="daily"><div class="quest-icon">⚡</div><div><span class="kicker">${dailyDone ? 'COMPLETED TODAY' : '2–3 MINUTES'}</span><h3>Daily 5</h3><p>${dailyDone ? 'You can replay, but today is already complete.' : 'A balanced mix of recall, context and review.'}</p></div><span class="go">›</span></button>
        <button class="quest-card library" data-action="decks"><div class="quest-icon">🗃️</div><div><span class="kicker">OPEN LIBRARY</span><h3>Bible Recall Decks</h3><p>Thousands of open study questions, downloaded one Bible book at a time.</p></div><span class="go">›</span></button>
        <div class="mode-grid">
          <button class="mode-card" data-action="quick"><span>🎯</span><b>Quick Play</b><small>10 mixed questions</small></button>
          <button class="mode-card" data-action="review"><span>🔁</span><b>Review Mistakes</b><small>${state.wrong.length ? state.wrong.length + ' waiting' : 'Builds automatically'}</small></button>
          <button class="mode-card" data-action="context"><span>🧠</span><b>Context Mode</b><small>Why, not just who</small></button>
          <button class="mode-card" data-action="detective"><span>🕵️</span><b>Detective</b><small>Guess from clues</small></button>
          <button class="mode-card" data-action="story"><span>📖</span><b>Story Adventure</b><small>Read + checkpoint</small></button>
          <button class="mode-card" data-action="timeline"><span>⏳</span><b>Timeline</b><small>Put events in order</small></button>
        </div>
      </section>

      <div class="section-title"><h2>Wisdom & reflection</h2></div>
      <section class="grid">
        <button class="card big" data-action="situation"><div class="icon">🧭</div><h3>Situations & Wisdom</h3><p>Real-life decisions examined through biblical principles. Not fake one-answer theology.</p></button>
        <button class="card big" data-route="discuss"><div class="icon">💭</div><h3>Think Deeper</h3><p>Questions about faith, motives, planning, forgiveness and judgment.</p></button>
      </section>

      <div class="section-title"><h2>Group study</h2><small>Reserved for later</small></div>
      <div class="card study-preview"><div class="icon">👥</div><div><h3>Study Together</h3><p>Live rooms, polls and facilitator tools will plug into this spot later. The solo learning engine comes first.</p></div><span class="tag">FUTURE</span></div>
      <div class="data-note"><span>📦</span><div><b>Lightweight mode active</b><p>The full Bible library is never downloaded on launch. Core games, stories and individual Bible books are fetched only when needed, then cached on this device.</p></div></div>
    `);
  }

  async function ensureCore() {
    if (window.BQ_QUESTIONS && window.BQ_DETECTIVES && window.BQ_TIMELINES) return;
    await loadScripts([{ src: 'data/questions.js', label: 'Question pack' }], 'Opening your Bible game…');
  }

  async function ensureStories() {
    if (window.BQ_STORIES && window.BQ_SITUATIONS && window.BQ_DEEP_QUESTIONS) return;
    await loadScripts([{ src: 'data/stories.js', label: 'Story & wisdom pack' }], 'Preparing the story pack…');
  }

  async function loadScripts(items, title) {
    const missing = items.filter(x => !loadedScripts.has(x.src));
    if (!missing.length) return;
    showLoader(title, 0, missing.length);
    for (let i = 0; i < missing.length; i++) {
      const item = missing[i];
      setLoader(`Loading ${item.label}…`, i, missing.length);
      await loadScript(item.src);
      loadedScripts.add(item.src);
      setLoader(`${item.label} ready`, i + 1, missing.length);
    }
    hideLoader();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-pack="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.dataset.pack = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Could not load ${src}`));
      document.body.appendChild(s);
    });
  }

  async function fetchJson(src) {
    if (jsonCache.has(src)) return jsonCache.get(src);
    const response = await fetch(src);
    if (!response.ok) throw new Error(`${src} is not available yet (${response.status}).`);
    const data = await response.json();
    jsonCache.set(src, data);
    return data;
  }

  function showLoader(title, done = 0, total = 1) {
    const el = $('#loader');
    el.classList.remove('hidden');
    el.innerHTML = `<div class="loader-card"><div class="loader-sheep">🐑</div><div class="eyebrow">BibleQuest</div><h2>${esc(title)}</h2><p id="loaderText">Loading only the content this game needs.</p><div class="loadbar"><i id="loadbarFill" style="width:${total ? done / total * 100 : 8}%"></i></div><small>Smaller packs = faster startup and less data use.</small></div>`;
  }
  function setLoader(text, done, total) {
    const t = $('#loaderText'), b = $('#loadbarFill');
    if (t) t.textContent = text;
    if (b) b.style.width = `${Math.max(8, done / Math.max(total, 1) * 100)}%`;
  }
  function hideLoader() {
    const el = $('#loader');
    if (!el) return;
    setTimeout(() => el.classList.add('hidden'), 120);
  }
  function loadError(err, title = 'Could not load this game pack') {
    hideLoader();
    route('message', { title, body: 'The rest of BibleQuest still works. If this is your first time opening this content, check the connection and try again.', detail: err.message });
  }

  function buildQuestionBank(type) {
    let bank = [...BQ_QUESTIONS];
    if (type === 'context') bank = bank.filter(q => q.level >= 2 || q.mode === 'context' || q.mode === 'connection');
    if (type === 'review') {
      const ids = new Set(state.wrong);
      bank = bank.filter(q => ids.has(q.id));
      if (!bank.length) bank = [...BQ_QUESTIONS].sort((a, b) => (state.seen.includes(a.id) ? 1 : 0) - (state.seen.includes(b.id) ? 1 : 0)).slice(0, 8);
    }
    if (type === 'daily') {
      const wrong = new Set(state.wrong);
      const review = shuffle(bank.filter(q => wrong.has(q.id))).slice(0, 2);
      const unseen = shuffle(bank.filter(q => !state.seen.includes(q.id) && !wrong.has(q.id))).slice(0, 3);
      const fill = shuffle(bank.filter(q => !review.includes(q) && !unseen.includes(q))).slice(0, 5 - review.length - unseen.length);
      bank = [...review, ...unseen, ...fill];
    } else {
      bank = shuffle(bank).slice(0, type === 'review' ? Math.min(10, bank.length) : 10);
    }
    return bank;
  }

  async function startQuestions(type = 'quick') {
    try {
      await ensureCore();
      route('quiz', { bank: buildQuestionBank(type), index: 0, score: 0, gained: 0, answered: false, type });
    } catch (e) { loadError(e); }
  }

  function quizView() {
    const q = game.bank[game.index];
    if (!q) return results();
    return shell(`<button class="back" data-route="home">← Leave round</button><section class="question-card">
      <div class="question-meta"><span>${esc(q.book)} · ${q.mode === 'connection' ? 'Connections' : q.level >= 2 ? 'Context' : 'Recall'}</span><span>${game.index + 1}/${game.bank.length}</span></div>
      <div class="quiz-progress"><i style="width:${game.index / game.bank.length * 100}%"></i></div>
      <h2>${esc(q.q)}</h2>
      <div class="choices">${q.choices.map((c, i) => `<button class="choice" data-choice="${i}"><span>${String.fromCharCode(65 + i)}</span>${esc(c)}</button>`).join('')}</div>
      <div id="feedback"></div>
    </section>`);
  }

  function answerChoice(i) {
    if (game.answered) return;
    game.answered = true;
    const q = game.bank[game.index], good = i === q.answer;
    state.answered++;
    if (good) {
      state.correct++; state.xp += 10; game.score++; game.gained += 10;
      state.wrong = state.wrong.filter(id => id !== q.id);
    } else {
      state.xp += 3; game.gained += 3;
      if (!state.wrong.includes(q.id)) state.wrong.push(q.id);
    }
    if (!state.seen.includes(q.id)) state.seen.push(q.id);
    bumpMastery(q.book, good);
    save();
    $$('.choice').forEach((b, n) => {
      if (n === q.answer) b.classList.add('correct');
      else if (n === i && !good) b.classList.add('wrong');
      b.disabled = true;
    });
    $('#feedback').innerHTML = `<div class="explain"><div class="feedback-title">${good ? '✅ Correct' : '🌱 Added to review'}</div><p>${esc(q.why)}</p><span class="ref">📖 ${esc(q.ref)}</span><div class="source-label">${q.mode === 'basic' ? 'DIRECT / RECALL' : 'CONTEXT / CONNECTION'}</div></div><div class="actions"><button class="primary" data-next>${game.index + 1 === game.bank.length ? 'See results' : 'Next question'}</button></div>`;
    bind();
  }

  function results() {
    if (!game.finished) {
      game.finished = true;
      state.rounds = (state.rounds || 0) + 1;
      if (game.type === 'daily') state.dailyDone = today();
      save();
    }
    const pct = Math.round(100 * game.score / Math.max(1, game.bank.length));
    const msg = pct >= 90 ? 'Excellent recall. Keep connecting the details to the bigger story.' : pct >= 70 ? 'Good round. Your review list will keep the weak spots from disappearing.' : 'Useful round. The misses are now your next learning targets.';
    return shell(`<section class="result-hero"><div class="result-medal">${pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : '🌱'}</div><div class="eyebrow">Round complete</div><h1>${game.score}/${game.bank.length}</h1><p>${msg}</p><div class="stats"><div class="stat"><b>+${game.gained}</b><small>XP</small></div><div class="stat"><b>${pct}%</b><small>accuracy</small></div><div class="stat"><b>${state.wrong.length}</b><small>to review</small></div></div><div class="actions centered"><button class="primary" data-route="home">Back home</button><button class="secondary" data-action="${game.type === 'review' ? 'review' : 'quick'}">Play another</button></div></section>`);
  }

  async function openDeckLibrary() {
    try {
      showLoader('Opening the Bible library…', 0, 1);
      setLoader('Reading the tiny pack index…', 0, 1);
      packManifest = await fetchJson('data/packs/manifest.json');
      setLoader('Library ready', 1, 1);
      hideLoader();
      route('deckLibrary', { filter: '' });
    } catch (e) {
      loadError(e, 'Recall Deck library is being prepared');
    }
  }

  function deckLibraryView() {
    const books = packManifest?.question_books || [];
    const filter = (game?.filter || '').toLowerCase();
    const shown = books.filter(b => b.name.toLowerCase().includes(filter));
    const total = books.reduce((n, b) => n + (b.questions || 0), 0);
    return shell(`<section class="panel deck-library">
      <button class="back" data-route="home">← Home</button>
      <div class="eyebrow">Open recall library</div>
      <h1>Choose one book.</h1>
      <p>BibleQuest downloads only that book's question deck. Once opened, your browser can cache it for later.</p>
      <div class="journey-summary"><div><b>${books.length}</b><span>books available</span></div><div><b>${total.toLocaleString()}</b><span>open questions</span></div></div>
      <input class="answer-input deck-search" id="deckSearch" value="${esc(game?.filter || '')}" placeholder="Search Bible books…" autocomplete="off">
      <div class="deck-book-grid">${shown.map(book => {
        const review = (state.deckReview?.[book.code] || []).length;
        const stats = state.deckStats?.[book.code] || {};
        return `<button class="deck-book" data-deck="${esc(book.code)}"><span class="deck-book-icon">📘</span><span class="deck-book-copy"><b>${esc(book.name)}</b><small>${book.questions} questions · ${review} review${stats.seen ? ` · ${stats.seen} studied` : ''}</small></span><span class="go">›</span></button>`;
      }).join('') || '<div class="empty">No matching book.</div>'}</div>
      <div class="source-box"><b>Source:</b> unfoldingWord Translation Questions v90 (CC BY-SA 4.0). These are open recall/reference questions, not automatically generated multiple-choice items. Scripture itself remains the primary text to examine.</div>
    </section>`);
  }

  async function openDeck(code) {
    const meta = packManifest?.question_books?.find(b => b.code === code);
    if (!meta) return;
    try {
      showLoader(`Opening ${meta.name}…`, 0, 1);
      setLoader(`Downloading only the ${meta.name} recall deck…`, 0, 1);
      const rows = await fetchJson(meta.path);
      const reviewIds = new Set(state.deckReview?.[code] || []);
      const review = shuffle(rows.filter(x => reviewIds.has(x.id))).slice(0, 5);
      const fresh = shuffle(rows.filter(x => !reviewIds.has(x.id))).slice(0, Math.max(0, 10 - review.length));
      const items = [...review, ...fresh];
      setLoader(`${items.length} questions ready`, 1, 1);
      hideLoader();
      if (!items.length) return route('message', { title: `${meta.name} has no recall questions`, body: 'This book pack is empty in the current source version.' });
      route('deckPlay', { code, name: meta.name, items, index: 0, revealed: false, remembered: 0, reviewAgain: 0, gained: 0 });
    } catch (e) { loadError(e); }
  }

  function deckPlayView() {
    const item = game.items[game.index];
    if (!item) return deckResultsView();
    return shell(`<button class="back" data-route="deckLibrary">← Recall library</button><section class="question-card flashcard">
      <div class="question-meta"><span>${esc(game.name)} · Recall Deck</span><span>${game.index + 1}/${game.items.length}</span></div>
      <div class="quiz-progress"><i style="width:${game.index / game.items.length * 100}%"></i></div>
      <div class="flashcard-mark">🧠</div>
      <h2>${esc(item.q)}</h2>
      ${game.revealed ? `<div class="answer-reveal"><span class="source-label">REFERENCE ANSWER</span><p>${esc(item.a || 'No reference answer supplied in this source record.')}</p>${item.r ? `<span class="ref">📖 ${esc(item.r)}</span>` : ''}</div><div class="rating-row"><button class="secondary review-btn" data-deck-rate="again">🔁 Review again</button><button class="primary got-btn" data-deck-rate="got">✓ Got it</button></div>` : `<p class="think-prompt">Try to answer from memory before revealing the reference answer.</p><button class="primary reveal-btn" data-deck-reveal>Reveal answer</button>`}
      <div class="fine deck-license">Open study material: unfoldingWord Translation Questions v90 · CC BY-SA 4.0</div>
    </section>`);
  }

  function revealDeck() {
    game.revealed = true;
    render();
  }

  function rateDeck(gotIt) {
    const item = game.items[game.index];
    const code = game.code;
    state.deckReview[code] = state.deckReview[code] || [];
    const ids = state.deckReview[code];
    state.deckStats[code] = state.deckStats[code] || { seen: 0, got: 0, again: 0 };
    state.deckStats[code].seen++;
    state.answered++;
    if (gotIt) {
      state.deckReview[code] = ids.filter(id => id !== item.id);
      state.deckStats[code].got++;
      state.correct++;
      state.xp += 5;
      game.remembered++;
      game.gained += 5;
      bumpMastery(game.name, true);
    } else {
      if (!ids.includes(item.id)) ids.push(item.id);
      state.deckStats[code].again++;
      state.xp += 1;
      game.reviewAgain++;
      game.gained += 1;
      bumpMastery(game.name, false);
    }
    save();
    game.index++;
    game.revealed = false;
    if (game.index >= game.items.length) route('deckResults', game);
    else render();
  }

  function deckResultsView() {
    if (!game.finished) {
      game.finished = true;
      state.rounds = (state.rounds || 0) + 1;
      save();
    }
    const remaining = (state.deckReview?.[game.code] || []).length;
    return shell(`<section class="result-hero"><div class="result-medal">🗃️</div><div class="eyebrow">${esc(game.name)} deck complete</div><h1>${game.remembered}/${game.items.length}</h1><p>${game.reviewAgain ? `${game.reviewAgain} item${game.reviewAgain === 1 ? '' : 's'} will return in future ${esc(game.name)} sessions.` : 'Everything in this round was marked remembered.'}</p><div class="stats"><div class="stat"><b>+${game.gained}</b><small>XP</small></div><div class="stat"><b>${game.remembered}</b><small>got it</small></div><div class="stat"><b>${remaining}</b><small>book review</small></div></div><div class="actions centered"><button class="primary" data-deck="${esc(game.code)}">Study ${esc(game.name)} again</button><button class="secondary" data-route="deckLibrary">Choose another book</button></div></section>`);
  }

  function journey() {
    const tracks = [
      ['Genesis', '🌳', 'Creation, Abraham, Jacob, Joseph'], ['Exodus', '🏜️', 'Moses, rescue, covenant and wilderness'],
      ['History', '👑', 'Judges, kings, exile and return'], ['Wisdom', '🪶', 'Job, Psalms, Proverbs and wisdom'],
      ['Prophets', '🔥', 'Warning, hope and restoration'], ['Gospels', '🐟', 'Life and teaching of Jesus'],
      ['Acts', '🕊️', 'Pentecost and the early church'], ['Letters', '✉️', 'Christian life, church and theology']
    ];
    const avg = Math.round(Object.values(state.mastery).reduce((a, b) => a + b, 0) / Object.keys(state.mastery).length);
    return shell(`<section class="panel"><div class="eyebrow">Learning map</div><h1>Bible Journey</h1><p>Your map grows from actual play. A miss still adds a little progress because BibleQuest has identified what needs review.</p><div class="journey-summary"><div><b>${avg}%</b><span>overall explored</span></div><div><b>${state.seen.length}</b><span>core questions encountered</span></div></div><div class="journey">${tracks.map(([k, e, d]) => `<button class="journey-row" data-track="${k}"><div class="badge">${e}</div><div class="grow"><h3>${k}</h3><small>${d}</small><div class="mini-progress"><i style="width:${state.mastery[k] || 0}%"></i></div></div><span class="pill">${state.mastery[k] || 0}%</span></button>`).join('')}</div><div class="source-box"><b>Expansion path:</b> the new per-book recall decks and Bible text packs can fill these journey tracks without making startup heavy.</div></section>`);
  }

  async function trackPlay(track) {
    try {
      await ensureCore();
      let bank = BQ_QUESTIONS.filter(q => category(q.book) === track);
      if (!bank.length) {
        route('message', { title: `${track} core pack is still small`, body: 'Use Bible Recall Decks for the larger open question library while this journey track is expanded.' });
        return;
      }
      route('quiz', { bank: shuffle([...bank]).slice(0, 10), index: 0, score: 0, gained: 0, answered: false, type: 'track' });
    } catch (e) { loadError(e); }
  }

  async function detective() {
    try { await ensureCore(); route('detectivePlay', { item: pick(BQ_DETECTIVES) }); }
    catch (e) { loadError(e); }
  }
  function detectiveView() {
    const d = game.item;
    return shell(`<button class="back" data-route="home">← Back</button><section class="question-card"><div class="eyebrow">Bible Detective</div><h2>Who am I?</h2><div class="clues">${d.clues.map((x, i) => `<div class="clue"><span>${i + 1}</span>${esc(x)}</div>`).join('')}</div><input class="answer-input" id="detectiveAnswer" autocomplete="off" placeholder="Type the name…"><div class="actions"><button class="primary" data-check-detective>Check answer</button></div><div id="feedback"></div></section>`);
  }
  function checkDetective() {
    const d = game.item, value = ($('#detectiveAnswer')?.value || '').trim();
    if (!value) return;
    const good = value.toLowerCase() === d.answer.toLowerCase();
    state.answered++;
    if (good) { state.correct++; state.xp += 12; } else state.xp += 3;
    save();
    $('#feedback').innerHTML = `<div class="explain"><div class="feedback-title">${good ? '✅ Correct' : 'Answer: ' + esc(d.answer)}</div><span class="ref">📖 ${esc(d.ref)}</span></div><div class="actions"><button class="primary" data-action="detective">Another detective</button></div>`;
    bind();
  }

  async function story() {
    try { await ensureStories(); route('storyPlay', { story: pick(BQ_STORIES), scene: 0, answered: false }); }
    catch (e) { loadError(e); }
  }
  function storyView() {
    const s = game.story;
    if (game.scene < s.scenes.length) return shell(`<button class="back" data-route="home">← Back</button><section class="story-card"><div class="question-meta"><span>${s.emoji} ${esc(s.title)}</span><span>${game.scene + 1}/${s.scenes.length}</span></div><div class="scene-dots">${s.scenes.map((_, i) => `<i class="${i <= game.scene ? 'on' : ''}"></i>`).join('')}</div><div class="story-scene">${esc(s.scenes[game.scene])}</div><div class="actions"><button class="primary" data-story-next>${game.scene === s.scenes.length - 1 ? 'Checkpoint' : 'Continue story'}</button></div></section>`);
    const q = s.checkpoint;
    return shell(`<section class="question-card"><div class="eyebrow">Story checkpoint</div><h2>${esc(q.q)}</h2><div class="choices">${q.choices.map((c, i) => `<button class="choice" data-story-choice="${i}">${esc(c)}</button>`).join('')}</div><div id="feedback"></div></section>`);
  }
  function storyAnswer(i) {
    if (game.answered) return;
    game.answered = true;
    const q = game.story.checkpoint, good = i === q.answer;
    state.answered++;
    if (good) { state.correct++; state.xp += 15; } else state.xp += 4;
    save();
    $$('.choice').forEach((b, n) => { if (n === q.answer) b.classList.add('correct'); else if (n === i && !good) b.classList.add('wrong'); b.disabled = true; });
    $('#feedback').innerHTML = `<div class="explain"><div class="feedback-title">${good ? '✅ You followed the key idea' : '🌱 Revisit the key moment'}</div><span class="ref">📖 ${esc(q.ref)}</span></div><div class="actions"><button class="primary" data-action="story">Another story</button><button class="secondary" data-route="home">Home</button></div>`;
    bind();
  }

  async function timeline() {
    try { await ensureCore(); const t = structuredClone(pick(BQ_TIMELINES)); t.current = shuffle([...t.items]); route('timelinePlay', t); }
    catch (e) { loadError(e); }
  }
  function timelineView() {
    return shell(`<button class="back" data-route="home">← Back</button><section class="question-card"><div class="eyebrow">Timeline challenge</div><h2>${esc(game.title)}</h2><p>Move the events until they are in chronological order.</p><div class="timeline-list">${game.current.map((x, i) => `<div class="timeline-item"><span><b>${i + 1}.</b> ${esc(x)}</span><span class="move"><button class="tiny" data-move="${i},-1">↑</button><button class="tiny" data-move="${i},1">↓</button></span></div>`).join('')}</div><div class="actions"><button class="primary" data-check-timeline>Check order</button></div><div id="feedback"></div></section>`);
  }
  function move(i, d) { const j = i + d; if (j < 0 || j >= game.current.length) return; [game.current[i], game.current[j]] = [game.current[j], game.current[i]]; render(); }
  function checkTimeline() {
    const good = game.current.every((x, i) => x === game.items[i]);
    state.answered++;
    if (good) { state.correct++; state.xp += 20; } else state.xp += 4;
    save();
    $('#feedback').innerHTML = `<div class="explain"><div class="feedback-title">${good ? '✅ Perfect order' : 'Not yet'}</div><p>${good ? 'You placed every event correctly.' : 'Your arrangement is preserved. Move the uncertain items and try again.'}</p></div>`;
    bind();
  }

  async function situation() {
    try { await ensureStories(); route('situationPlay', { item: pick(BQ_SITUATIONS), answered: false }); }
    catch (e) { loadError(e); }
  }
  function situationView() {
    const s = game.item;
    return shell(`<button class="back" data-route="home">← Back</button><section class="question-card"><div class="eyebrow">Situations & Wisdom</div><h2>${esc(s.title)}</h2><div class="scenario">${esc(s.scenario)}</div><div class="choices">${s.options.map((o, i) => `<button class="choice" data-situation="${i}">${esc(o)}</button>`).join('')}</div><div id="feedback"></div></section>`);
  }
  function chooseSituation(i) {
    if (game.answered) return;
    game.answered = true;
    const s = game.item;
    state.situations++; state.xp += 6; save();
    $$('.choice').forEach((b, n) => { b.disabled = true; if (n === i) b.classList.add('selected'); });
    $('#feedback').innerHTML = `<div class="explain"><span class="source-label">WISDOM / APPLICATION</span><p><b>You chose:</b> ${esc(s.options[i])}</p><p>${esc(s.note)}</p><span class="ref">📖 ${s.refs.map(esc).join(' · ')}</span><p class="fine">This mode explores biblical principles and judgment. It does not turn every complex situation into a one-answer doctrine quiz.</p></div><div class="actions"><button class="primary" data-action="situation">Another situation</button><button class="secondary" data-route="home">Home</button></div>`;
    bind();
  }

  async function discuss() {
    try { await ensureStories(); route('discussReady'); }
    catch (e) { loadError(e); }
  }
  function discussView() {
    if (!window.BQ_DEEP_QUESTIONS) return shell(`<section class="panel"><div class="eyebrow">Think deeper</div><h1>Questions worth discussing.</h1><p>This reflection pack is separate so it never blocks the home screen.</p><button class="primary" data-action="open-discuss">Open reflection pack</button></section>`);
    const p = BQ_DEEP_QUESTIONS[new Date().getDate() % BQ_DEEP_QUESTIONS.length];
    const sel = state.polls[p.id];
    return shell(`<section class="panel"><div class="eyebrow">Question for everyone</div><h1>${esc(p.q)}</h1><p>${esc(p.context)}</p><div class="poll-options">${p.options.map((o, i) => `<button class="poll ${sel === i ? 'selected' : ''}" data-poll="${p.id},${i}">${esc(o)}</button>`).join('')}</div><div class="source-box"><b>Passages to examine</b><br>${p.refs.map(esc).join(' · ')}<br><br><b>Classification:</b> open reflection. BibleQuest does not treat the most popular response as biblical authority.</div><div class="section-title"><h2>Study Together</h2><small>Future slot</small></div><div class="card study-preview"><div class="icon">🗣️</div><div><h3>Live responses later</h3><p>This same view can later become anonymous before/after polls and group discussion without changing the solo app.</p></div></div></section>`);
  }
  function savePoll(id, i) { state.polls[id] = i; save(); render(); }

  function profile() {
    const defs = {
      first: ['🌱', 'First Step', 'Answer your first question'], ten: ['⭐', 'Ten Correct', 'Get 10 questions right'],
      twentyfive: ['🏅', 'Growing Scholar', 'Get 25 questions right'], xp250: ['🔥', '250 XP', 'Reach 250 learning XP'],
      wisdom3: ['🧭', 'Wisdom Explorer', 'Complete 3 situations'], round5: ['🎮', 'Five Rounds', 'Complete 5 game rounds'],
      master50: ['🗺️', 'Halfway There', 'Reach 50% on one journey track'], deck20: ['🗃️', 'Deck Explorer', 'Study 20 cards in one Bible book']
    };
    const deckReviewCount = Object.values(state.deckReview || {}).reduce((n, ids) => n + ids.length, 0);
    return shell(`<section class="panel"><div class="eyebrow">Your progress</div><h1>Growing, not grinding.</h1><div class="stats"><div class="stat"><b>${state.xp}</b><small>XP</small></div><div class="stat"><b>${state.correct}</b><small>remembered/correct</small></div><div class="stat"><b>${accuracy()}%</b><small>self + quiz</small></div></div><div class="section-title"><h2>Achievements</h2></div><div class="achievement-list">${Object.entries(defs).map(([id, [e, n, d]]) => `<div class="achievement ${state.achievements.includes(id) ? 'earned' : ''}"><div class="medal">${e}</div><div><b>${n}</b><div>${d}</div></div></div>`).join('')}</div><div class="section-title"><h2>App mode</h2></div><div class="source-box"><b>Backend:</b> Off<br><b>Progress:</b> This device only<br><b>Content delivery:</b> On-demand packs + offline runtime cache<br><b>Deck review queue:</b> ${deckReviewCount}<br><b>Full imported library:</b> Never downloaded on launch</div><div class="section-title"><h2>Device controls</h2></div><div class="card"><h3>Local progress</h3><p>Clearing browser data removes progress until accounts are added later.</p><div class="actions"><button class="secondary danger" data-reset>Reset progress</button></div></div></section>`);
  }

  function messageView() {
    return shell(`<section class="question-card"><div class="eyebrow">BibleQuest</div><h2>${esc(game?.title || 'Notice')}</h2><p>${esc(game?.body || '')}</p>${game?.detail ? `<div class="source-box">${esc(game.detail)}</div>` : ''}<div class="actions"><button class="primary" data-route="home">Home</button>${game?.title?.includes('Recall Deck') ? '<button class="secondary" data-action="decks">Try library again</button>' : ''}</div></section>`);
  }

  function render() {
    let html = '';
    if (view === 'home') html = home();
    else if (view === 'journey') html = journey();
    else if (view === 'quiz') html = quizView();
    else if (view === 'results') html = results();
    else if (view === 'deckLibrary') html = deckLibraryView();
    else if (view === 'deckPlay') html = deckPlayView();
    else if (view === 'deckResults') html = deckResultsView();
    else if (view === 'detectivePlay') html = detectiveView();
    else if (view === 'storyPlay') html = storyView();
    else if (view === 'timelinePlay') html = timelineView();
    else if (view === 'situationPlay') html = situationView();
    else if (view === 'discuss' || view === 'discussReady') html = discussView();
    else if (view === 'profile') html = profile();
    else if (view === 'message') html = messageView();
    else html = home();
    $('#app').innerHTML = html;
    bind();
  }

  function bind() {
    $$('[data-route]').forEach(b => b.onclick = () => {
      const r = b.dataset.route;
      if (r === 'discuss') discuss();
      else if (r === 'deckLibrary') {
        if (packManifest) route('deckLibrary', { filter: '' });
        else openDeckLibrary();
      } else route(r);
    });

    $$('[data-action]').forEach(b => b.onclick = async () => {
      const a = b.dataset.action;
      if (['daily', 'quick', 'review', 'context'].includes(a)) await startQuestions(a);
      else if (a === 'decks') await openDeckLibrary();
      else if (a === 'detective') await detective();
      else if (a === 'story') await story();
      else if (a === 'timeline') await timeline();
      else if (a === 'situation') await situation();
      else if (a === 'open-discuss') await discuss();
    });

    $$('[data-choice]').forEach(b => b.onclick = () => answerChoice(+b.dataset.choice));
    const next = $('[data-next]');
    if (next) next.onclick = () => { game.index++; game.answered = false; if (game.index >= game.bank.length) route('results', game); else render(); };

    $$('[data-deck]').forEach(b => b.onclick = () => openDeck(b.dataset.deck));
    const deckSearch = $('#deckSearch');
    if (deckSearch) deckSearch.oninput = e => { game.filter = e.target.value; render(); const n = $('#deckSearch'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } };
    const reveal = $('[data-deck-reveal]');
    if (reveal) reveal.onclick = revealDeck;
    $$('[data-deck-rate]').forEach(b => b.onclick = () => rateDeck(b.dataset.deckRate === 'got'));

    const det = $('[data-check-detective]');
    if (det) det.onclick = checkDetective;
    const storyNext = $('[data-story-next]');
    if (storyNext) storyNext.onclick = () => { game.scene++; render(); };
    $$('[data-story-choice]').forEach(b => b.onclick = () => storyAnswer(+b.dataset.storyChoice));
    $$('[data-move]').forEach(b => b.onclick = () => { const [i, d] = b.dataset.move.split(',').map(Number); move(i, d); });
    const timelineCheck = $('[data-check-timeline]');
    if (timelineCheck) timelineCheck.onclick = checkTimeline;
    $$('[data-situation]').forEach(b => b.onclick = () => chooseSituation(+b.dataset.situation));
    $$('[data-poll]').forEach(b => b.onclick = () => { const [id, i] = b.dataset.poll.split(','); savePoll(id, +i); });
    $$('[data-track]').forEach(b => b.onclick = () => trackPlay(b.dataset.track));

    const reset = $('[data-reset]');
    if (reset) reset.onclick = () => {
      if (confirm('Reset all BibleQuest progress on this device?')) {
        state = structuredClone(defaults);
        save();
        route('home');
      }
    };
  }

  checkDay();
  render();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();

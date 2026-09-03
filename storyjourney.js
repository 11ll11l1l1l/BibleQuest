(() => {
  const KEY = 'biblequest_story_journey_v1';
  const jsonCache = new Map();
  let manifest = null;
  let session = null;

  const esc = (s = '') => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function getState() {
    try { return { completed: [], current: null, review: {}, ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; }
    catch { return { completed: [], current: null, review: {} }; }
  }
  function setState(next) { localStorage.setItem(KEY, JSON.stringify(next)); }
  function patchState(patch) { const next = { ...getState(), ...patch }; setState(next); return next; }

  async function fetchJson(path) {
    if (jsonCache.has(path)) return jsonCache.get(path);
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${path} returned ${r.status}`);
    const data = await r.json();
    jsonCache.set(path, data);
    return data;
  }

  function injectHomeCard() {
    const stack = document.querySelector('.feature-stack');
    if (!stack || document.querySelector('[data-storyjourney-open]')) return;
    const reader = stack.querySelector('.quest-card.reader');
    const deck = stack.querySelector('.quest-card.library');
    const card = document.createElement('button');
    card.className = 'quest-card story-journey-card';
    card.setAttribute('data-storyjourney-open', '1');
    card.innerHTML = '<div class="quest-icon">🏕️</div><div><span class="kicker">50 FOUNDATIONAL STORIES</span><h3>Story Journey</h3><p>Illustrated Bible narratives with recall checkpoints as you progress.</p></div><span class="go">›</span>';
    if (reader) reader.after(card); else if (deck) deck.after(card); else stack.prepend(card);
  }

  function layer() {
    let el = document.getElementById('bqStoryJourney');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bqStoryJourney';
      el.className = 'sj-layer hidden';
      document.body.appendChild(el);
    }
    return el;
  }
  function show(html) {
    const el = layer();
    el.innerHTML = `<main class="sj-app">${html}</main>`;
    el.classList.remove('hidden');
    document.body.classList.add('story-journey-open');
    bind();
    el.scrollTop = 0;
  }
  function close() {
    layer().classList.add('hidden');
    document.body.classList.remove('story-journey-open');
    session = null;
  }

  function loading(title, body = 'Loading only this part of the journey…') {
    show(`<section class="sj-loading"><div class="sj-loading-icon">🐑</div><div class="eyebrow">Story Journey</div><h1>${esc(title)}</h1><p>${esc(body)}</p><div class="sj-loadbar"><i></i></div><button class="sj-text" data-sj-close>Cancel</button></section>`);
  }

  async function openLibrary() {
    try {
      loading('Opening the story path…', 'Fetching the small story index. No story scenes are downloaded yet.');
      manifest = manifest || await fetchJson('data/packs/manifest.json');
      if (!manifest.stories?.length) throw new Error('The story pack index has not been published yet.');
      renderLibrary();
    } catch (e) { renderError('Story Journey is still being prepared', 'The regular BibleQuest games continue to work while these story packs are generated.', e.message); }
  }

  function renderLibrary(filter = '') {
    const stories = manifest?.stories || [];
    const state = getState();
    const q = filter.toLowerCase().trim();
    const shown = stories.filter(s => s.title.toLowerCase().includes(q) || s.reference.toLowerCase().includes(q));
    const pct = stories.length ? Math.round(state.completed.length / stories.length * 100) : 0;
    const current = stories.find(s => s.id === state.current?.id);
    show(`<header class="sj-top"><button data-sj-close>← BibleQuest</button><b>Story Journey</b><span>${state.completed.length}/50</span></header>
      <section class="sj-panel">
        <div class="eyebrow">The big story</div><h1>Walk through Scripture in 50 stories.</h1>
        <p class="sj-intro">Read a few illustrated scenes at a time, then answer from memory. This mode is designed to teach the narrative before testing details.</p>
        <div class="sj-progress-wrap"><div><b>${pct}%</b><small>journey complete</small></div><div class="sj-progress"><i style="width:${pct}%"></i></div></div>
        ${current ? `<button class="sj-continue" data-sj-story="${esc(current.id)}" data-sj-resume="1"><span>↗</span><div><small>CONTINUE STORY</small><b>${esc(current.title)}</b></div></button>` : ''}
        <input class="answer-input sj-search" id="sjSearch" value="${esc(filter)}" placeholder="Search stories or references…" autocomplete="off">
        <div class="sj-list">${shown.map(s => {
          const done = state.completed.includes(s.id);
          return `<button class="sj-story-row ${done ? 'done' : ''}" data-sj-story="${esc(s.id)}"><span class="sj-number">${done ? '✓' : Number(s.id)}</span><span class="sj-copy"><b>${esc(s.title)}</b><small>${esc(s.reference || 'Bible narrative')} · ${s.scenes} scenes · ${s.questions} questions</small></span><span class="go">›</span></button>`;
        }).join('') || '<div class="empty">No matching story.</div>'}</div>
        <div class="sj-source"><b>Source:</b> Open Bible Stories v9 + OBS Translation Questions v10 by unfoldingWord / Door43 · CC BY-SA 4.0. Illustrations are loaded scene-by-scene from the upstream Door43 CDN.</div>
      </section>`);
  }

  async function openStory(id, resume = false) {
    const meta = manifest?.stories?.find(s => s.id === id);
    if (!meta) return;
    try {
      loading(`Opening ${meta.title}…`, 'Downloading just this one story and its recall questions.');
      const story = await fetchJson(meta.path);
      const saved = getState().current;
      const scene = resume && saved?.id === id ? Math.min(Number(saved.scene) || 0, story.scenes.length - 1) : 0;
      session = {
        meta,
        story,
        scene,
        phase: 'read',
        questions: buildQuestionSet(story),
        qi: 0,
        revealed: false,
        remembered: 0,
        revisit: 0,
      };
      saveCurrent();
      renderScene();
    } catch (e) { renderError(`Could not open ${meta.title}`, 'Try once while connected. The story itself is cached after a successful load.', e.message, true); }
  }

  function buildQuestionSet(story) {
    const state = getState();
    const reviewIds = new Set(state.review?.[story.id] || []);
    const review = shuffle((story.questions || []).filter(q => reviewIds.has(q.id))).slice(0, 2);
    const fresh = shuffle((story.questions || []).filter(q => !reviewIds.has(q.id))).slice(0, Math.max(0, 3 - review.length));
    return [...review, ...fresh];
  }

  function saveCurrent() {
    if (!session) return;
    const state = getState();
    state.current = { id: session.story.id, scene: session.scene };
    setState(state);
  }

  function renderScene() {
    const s = session.story, scene = s.scenes[session.scene];
    const pct = Math.round((session.scene + 1) / s.scenes.length * 100);
    show(`<header class="sj-top"><button data-sj-library>← Stories</button><b>${esc(session.meta.title)}</b><button data-sj-close>×</button></header>
      <section class="sj-reader">
        <div class="sj-scene-head"><div><div class="eyebrow">Story ${Number(s.id)} · Scene ${session.scene + 1}</div><h1>${esc(s.title)}</h1></div><span>${pct}%</span></div>
        <div class="sj-scene-progress"><i style="width:${pct}%"></i></div>
        <figure class="sj-figure">${scene.image ? `<img src="${esc(scene.image)}" alt="Illustration for ${esc(s.title)}, scene ${scene.n}" loading="eager" referrerpolicy="no-referrer">` : '<div class="sj-image-fallback">📖</div>'}<figcaption>Scene ${scene.n} of ${s.scenes.length}</figcaption></figure>
        <div class="sj-story-text">${esc(scene.text)}</div>
        <div class="sj-scene-actions"><button class="sj-secondary" data-sj-prev ${session.scene === 0 ? 'disabled' : ''}>← Previous</button><button class="sj-primary" data-sj-next>${session.scene === s.scenes.length - 1 ? 'Recall checkpoint →' : 'Next scene →'}</button></div>
        <div class="sj-reference">📖 ${esc(s.reference || '')}</div>
      </section>`);
  }

  function nextScene() {
    if (session.scene < session.story.scenes.length - 1) {
      session.scene++;
      saveCurrent();
      renderScene();
    } else {
      session.phase = 'questions';
      session.qi = 0;
      session.revealed = false;
      renderQuestion();
    }
  }
  function prevScene() {
    if (session.scene > 0) { session.scene--; saveCurrent(); renderScene(); }
  }

  function renderQuestion() {
    if (!session.questions.length || session.qi >= session.questions.length) return finishStory();
    const q = session.questions[session.qi];
    show(`<header class="sj-top"><button data-sj-back-story>← Story</button><b>Recall Check</b><button data-sj-close>×</button></header>
      <section class="sj-question">
        <div class="eyebrow">Checkpoint ${session.qi + 1}/${session.questions.length}</div><div class="sj-brain">🧠</div><h1>${esc(q.question)}</h1>
        ${session.revealed ? `<div class="sj-answer"><span>REFERENCE ANSWER</span><p>${esc(q.answer || 'No reference answer is supplied for this question.')}</p><small>Open Bible Stories ${esc(q.reference || '')}</small></div><div class="sj-rate"><button class="sj-secondary" data-sj-rate="again">🔁 Review again</button><button class="sj-primary" data-sj-rate="got">✓ I remembered</button></div>` : `<p class="sj-think">Say the answer in your own words before revealing it. Exact wording is not required.</p><button class="sj-primary sj-reveal" data-sj-reveal>Reveal reference answer</button>`}
        <div class="sj-source compact"><b>Question source:</b> OBS Translation Questions v10 · CC BY-SA 4.0.</div>
      </section>`);
  }

  function rateQuestion(got) {
    const q = session.questions[session.qi];
    const state = getState();
    state.review = state.review || {};
    state.review[session.story.id] = state.review[session.story.id] || [];
    if (got) {
      state.review[session.story.id] = state.review[session.story.id].filter(id => id !== q.id);
      session.remembered++;
    } else {
      if (!state.review[session.story.id].includes(q.id)) state.review[session.story.id].push(q.id);
      session.revisit++;
    }
    setState(state);
    session.qi++;
    session.revealed = false;
    renderQuestion();
  }

  function finishStory() {
    const state = getState();
    if (!state.completed.includes(session.story.id)) state.completed.push(session.story.id);
    state.current = null;
    setState(state);
    const nextId = String(Number(session.story.id) + 1).padStart(2, '0');
    const next = manifest.stories.find(s => s.id === nextId);
    const reviewCount = state.review?.[session.story.id]?.length || 0;
    show(`<section class="sj-finish"><div class="sj-finish-icon">${session.revisit ? '🌱' : '🌟'}</div><div class="eyebrow">Story complete</div><h1>${esc(session.story.title)}</h1><p>${session.questions.length ? `${session.remembered}/${session.questions.length} recall questions marked remembered.` : 'Story reading complete.'} ${reviewCount ? `${reviewCount} question${reviewCount === 1 ? '' : 's'} will return when you revisit this story.` : ''}</p><div class="sj-finish-stats"><div><b>${state.completed.length}/50</b><small>stories</small></div><div><b>${reviewCount}</b><small>review</small></div></div><div class="sj-finish-actions">${next ? `<button class="sj-primary" data-sj-story="${esc(next.id)}">Next: ${esc(next.title)}</button>` : ''}<button class="sj-secondary" data-sj-library>Story map</button><button class="sj-text" data-sj-close>Back to BibleQuest</button></div><div class="sj-source"><b>Bible reference:</b> ${esc(session.story.reference || '')}</div></section>`);
  }

  function renderError(title, body, detail = '', back = false) {
    show(`<section class="sj-loading"><div class="sj-loading-icon">📚</div><div class="eyebrow">Story Journey</div><h1>${esc(title)}</h1><p>${esc(body)}</p>${detail ? `<div class="sj-source">${esc(detail)}</div>` : ''}<div class="sj-finish-actions">${back ? '<button class="sj-primary" data-sj-library>Back to stories</button>' : '<button class="sj-primary" data-sj-close>Back to BibleQuest</button>'}</div></section>`);
  }

  function bind() {
    const el = layer();
    el.querySelectorAll('[data-sj-close]').forEach(b => b.onclick = close);
    el.querySelectorAll('[data-sj-library]').forEach(b => b.onclick = () => renderLibrary());
    el.querySelectorAll('[data-sj-story]').forEach(b => b.onclick = () => openStory(b.dataset.sjStory, b.dataset.sjResume === '1'));
    const search = el.querySelector('#sjSearch');
    if (search) search.oninput = e => {
      const value = e.target.value;
      renderLibrary(value);
      const n = layer().querySelector('#sjSearch');
      if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
    };
    const next = el.querySelector('[data-sj-next]'); if (next) next.onclick = nextScene;
    const prev = el.querySelector('[data-sj-prev]'); if (prev) prev.onclick = prevScene;
    const back = el.querySelector('[data-sj-back-story]'); if (back) back.onclick = () => { session.phase = 'read'; renderScene(); };
    const reveal = el.querySelector('[data-sj-reveal]'); if (reveal) reveal.onclick = () => { session.revealed = true; renderQuestion(); };
    el.querySelectorAll('[data-sj-rate]').forEach(b => b.onclick = () => rateQuestion(b.dataset.sjRate === 'got'));
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-storyjourney-open]');
    if (b) { e.preventDefault(); openLibrary(); }
  });
  const observer = new MutationObserver(injectHomeCard);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  injectHomeCard();
})();

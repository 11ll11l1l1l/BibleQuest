(() => {
  const READER_STATE = 'biblequest_reader_v1';
  const cache = new Map();
  let manifest = null;
  let current = null;
  let observer = null;

  const esc = (s = '') => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  function loadState() {
    try { return JSON.parse(localStorage.getItem(READER_STATE) || '{}'); }
    catch { return {}; }
  }

  function saveState(patch) {
    const next = { ...loadState(), ...patch };
    localStorage.setItem(READER_STATE, JSON.stringify(next));
    return next;
  }

  async function fetchJson(path) {
    if (cache.has(path)) return cache.get(path);
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${path} returned ${r.status}`);
    const data = await r.json();
    cache.set(path, data);
    return data;
  }

  function injectHomeButton() {
    const host = document.querySelector('.feature-stack');
    if (!host || document.querySelector('[data-reader-open]')) return;
    const deck = host.querySelector('.quest-card.library');
    const button = document.createElement('button');
    button.className = 'quest-card reader';
    button.setAttribute('data-reader-open', '1');
    button.innerHTML = '<div class="quest-icon">📚</div><div><span class="kicker">READ ONE BOOK AT A TIME</span><h3>Bible Reader</h3><p>Open a book and chapter without downloading the whole library.</p></div><span class="go">›</span>';
    if (deck) deck.after(button); else host.prepend(button);
  }

  function ensureLayer() {
    let layer = document.getElementById('bqReaderLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'bqReaderLayer';
      layer.className = 'reader-layer hidden';
      layer.setAttribute('aria-live', 'polite');
      document.body.appendChild(layer);
    }
    return layer;
  }

  function showLayer(html) {
    const layer = ensureLayer();
    layer.innerHTML = `<main class="reader-app">${html}</main>`;
    layer.classList.remove('hidden');
    document.body.classList.add('reader-open');
    bindLayer();
    layer.scrollTop = 0;
  }

  function closeLayer() {
    const layer = ensureLayer();
    layer.classList.add('hidden');
    document.body.classList.remove('reader-open');
    current = null;
  }

  function loading(title, detail = 'Loading only what this page needs…') {
    showLayer(`<section class="reader-loading"><div class="reader-sheep">🐑</div><div class="eyebrow">Bible Reader</div><h1>${esc(title)}</h1><p>${esc(detail)}</p><div class="reader-loadbar"><i></i></div><button class="reader-text-btn" data-reader-close>Cancel</button></section>`);
  }

  async function openLibrary() {
    try {
      loading('Opening the Bible shelf…', 'Fetching the small book index. No Bible text is downloaded yet.');
      manifest = manifest || await fetchJson('data/packs/manifest.json');
      renderLibrary();
    } catch (e) {
      renderError('Bible text packs are still being prepared', 'The game remains usable. The reader will activate automatically when the generated per-book Bible files are published.', e.message);
    }
  }

  function renderLibrary(filter = '') {
    const books = manifest?.bible_books || [];
    const q = filter.trim().toLowerCase();
    const shown = books.filter(b => b.name.toLowerCase().includes(q));
    const last = loadState();
    showLayer(`
      <header class="reader-top"><button class="reader-back" data-reader-close>← BibleQuest</button><b>Bible Reader</b><span class="reader-chip">On demand</span></header>
      <section class="reader-panel">
        <div class="eyebrow">Choose a book</div><h1>Read without the giant download.</h1>
        <p class="reader-intro">Only the selected Bible book is fetched. After the first load, the service worker can reuse the cached copy on this device.</p>
        ${last.code && books.some(b => b.code === last.code) ? `<button class="reader-continue" data-reader-book="${esc(last.code)}" data-reader-chapter="${Number(last.chapter) || 1}"><span>↗</span><div><small>CONTINUE READING</small><b>${esc(last.name || last.code)} ${Number(last.chapter) || 1}</b></div></button>` : ''}
        <input class="answer-input reader-search" id="readerSearch" value="${esc(filter)}" placeholder="Search Bible books…" autocomplete="off">
        <div class="reader-book-grid">${shown.map(book => `<button class="reader-book" data-reader-book="${esc(book.code)}"><span class="reader-book-icon">📖</span><span><b>${esc(book.name)}</b><small>${Number(book.verses || 0).toLocaleString()} verses</small></span><span class="go">›</span></button>`).join('') || '<div class="empty">No matching Bible book.</div>'}</div>
        <div class="reader-source"><b>Text source:</b> Berean Standard Bible public-domain/CC0 data distributed through the BibleQuest resource builder.</div>
      </section>`);
  }

  async function openBook(code, requestedChapter = null) {
    const meta = manifest?.bible_books?.find(b => b.code === code);
    if (!meta) return;
    try {
      loading(`Opening ${meta.name}…`, `Downloading only ${meta.name}. Other Bible books remain untouched.`);
      const rows = await fetchJson(meta.path);
      const chapters = [...new Set(rows.map(v => Number(v.c)).filter(Number.isFinite))].sort((a, b) => a - b);
      if (!chapters.length) throw new Error('No chapter data was found in this book pack.');
      const chapter = chapters.includes(Number(requestedChapter)) ? Number(requestedChapter) : chapters[0];
      current = { meta, rows, chapters, chapter };
      saveState({ code, name: meta.name, chapter });
      renderChapter();
    } catch (e) {
      renderError(`Could not open ${meta.name}`, 'Try once while connected. After a successful first load, this book can be served from the browser cache.', e.message, true);
    }
  }

  function renderChapter() {
    if (!current) return;
    const { meta, rows, chapters, chapter } = current;
    const verses = rows.filter(v => Number(v.c) === chapter);
    const idx = chapters.indexOf(chapter);
    showLayer(`
      <header class="reader-top"><button class="reader-back" data-reader-library>← Books</button><b>${esc(meta.name)}</b><button class="reader-close-x" data-reader-close aria-label="Close reader">×</button></header>
      <section class="reader-panel reader-chapter">
        <div class="reader-title-row"><div><div class="eyebrow">Bible Reader</div><h1>${esc(meta.name)} ${chapter}</h1></div><span class="reader-chip">${verses.length} verses</span></div>
        <div class="chapter-tools">
          <button class="chapter-nav" data-reader-prev ${idx <= 0 ? 'disabled' : ''}>← Prev</button>
          <label>Chapter <select id="readerChapter">${chapters.map(c => `<option value="${c}" ${c === chapter ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <button class="chapter-nav" data-reader-next ${idx >= chapters.length - 1 ? 'disabled' : ''}>Next →</button>
        </div>
        <article class="verse-list">${verses.map(v => `<p><sup>${Number(v.v)}</sup>${esc(v.t)}</p>`).join('')}</article>
        <div class="reader-study-actions">
          <button class="reader-primary" data-reader-save>🔖 Save this passage</button>
          <button class="reader-secondary" data-reader-practice="${esc(meta.code)}">🧠 Practice ${esc(meta.name)}</button>
        </div>
        <div id="readerNotice"></div>
        <div class="reader-source"><b>Delivery:</b> one book JSON pack. <b>Storage:</b> browser runtime cache. <b>Backend:</b> none.</div>
      </section>`);
  }

  function moveChapter(delta) {
    if (!current) return;
    const i = current.chapters.indexOf(current.chapter);
    const next = current.chapters[i + delta];
    if (!next) return;
    current.chapter = next;
    saveState({ code: current.meta.code, name: current.meta.name, chapter: next });
    renderChapter();
  }

  function savePassage() {
    if (!current) return;
    const saved = { code: current.meta.code, name: current.meta.name, chapter: current.chapter, savedAt: new Date().toISOString() };
    localStorage.setItem('biblequest_saved_passage_v1', JSON.stringify(saved));
    const notice = document.getElementById('readerNotice');
    if (notice) notice.innerHTML = `<div class="reader-notice">✓ ${esc(current.meta.name)} ${current.chapter} saved on this device. This can become the starting passage for the future Study Builder.</div>`;
  }

  function practiceBook(code) {
    closeLayer();
    setTimeout(() => {
      const deckButton = document.querySelector('.quest-card.library');
      if (!deckButton) return;
      deckButton.click();
      const start = Date.now();
      const timer = setInterval(() => {
        const book = document.querySelector(`[data-deck="${CSS.escape(code)}"]`);
        if (book) { clearInterval(timer); book.click(); }
        else if (Date.now() - start > 6000) clearInterval(timer);
      }, 120);
    }, 50);
  }

  function renderError(title, body, detail = '', backToLibrary = false) {
    showLayer(`<section class="reader-loading reader-error"><div class="reader-sheep">📚</div><div class="eyebrow">Bible Reader</div><h1>${esc(title)}</h1><p>${esc(body)}</p>${detail ? `<div class="reader-source">${esc(detail)}</div>` : ''}<div class="reader-error-actions">${backToLibrary ? '<button class="reader-primary" data-reader-library>Back to books</button>' : '<button class="reader-primary" data-reader-close>Back to BibleQuest</button>'}</div></section>`);
  }

  function bindLayer() {
    const layer = ensureLayer();
    layer.querySelectorAll('[data-reader-close]').forEach(b => b.onclick = closeLayer);
    layer.querySelectorAll('[data-reader-library]').forEach(b => b.onclick = () => renderLibrary());
    layer.querySelectorAll('[data-reader-book]').forEach(b => b.onclick = () => openBook(b.dataset.readerBook, b.dataset.readerChapter || null));
    const search = layer.querySelector('#readerSearch');
    if (search) search.oninput = e => {
      const value = e.target.value;
      renderLibrary(value);
      const next = ensureLayer().querySelector('#readerSearch');
      if (next) { next.focus(); next.setSelectionRange(next.value.length, next.value.length); }
    };
    const chapter = layer.querySelector('#readerChapter');
    if (chapter) chapter.onchange = e => {
      current.chapter = Number(e.target.value);
      saveState({ code: current.meta.code, name: current.meta.name, chapter: current.chapter });
      renderChapter();
    };
    const prev = layer.querySelector('[data-reader-prev]'); if (prev) prev.onclick = () => moveChapter(-1);
    const next = layer.querySelector('[data-reader-next]'); if (next) next.onclick = () => moveChapter(1);
    const save = layer.querySelector('[data-reader-save]'); if (save) save.onclick = savePassage;
    layer.querySelectorAll('[data-reader-practice]').forEach(b => b.onclick = () => practiceBook(b.dataset.readerPractice));
  }

  document.addEventListener('click', e => {
    const button = e.target.closest('[data-reader-open]');
    if (button) { e.preventDefault(); openLibrary(); }
  });

  observer = new MutationObserver(injectHomeButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  injectHomeButton();
})();

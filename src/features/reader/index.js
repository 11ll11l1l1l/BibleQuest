const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const externalAttrs = 'target="_blank" rel="noopener noreferrer"';
const options = (items, value, key = 'id', label = 'label') => items.map(item => `<option value="${escapeHtml(item[key])}" ${item[key] === value ? 'selected' : ''}>${escapeHtml(item[label])}</option>`).join('');

export function readerPage({ reader }) {
  return {
    title: 'Bible Reader',
    html: '<section data-reader-page><div class="bq-panel"><p>Loading Bible Reader…</p></div></section>',
    mount(root) {
      const host = root.querySelector('[data-reader-page]');
      let searchResults = null;
      let highlightVerse = null;
      let operation = 0;
      const renderLoading = message => { host.innerHTML = `<section class="bq-panel"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p>${escapeHtml(message)}</p></section>`; };
      const renderError = error => { host.innerHTML = `<section class="bq-panel"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p class="bq-form-message">${escapeHtml(error?.message || 'Could not load Scripture.')}</p><button type="button" class="bq-secondary-button" data-reader-retry>Retry</button></section>`; };
      const renderSearch = () => {
        if (!searchResults) return '';
        const warning = searchResults.skippedBooks?.length ? `<p class="bq-reader-note">${searchResults.skippedBooks.length} book pack(s) were unavailable during this search.</p>` : '';
        if (!searchResults.results.length) return `<section class="bq-search-results"><h2>Search results</h2><p>No matches found.</p>${warning}</section>`;
        return `<section class="bq-search-results"><div class="bq-reader-title"><h2>Search results</h2><small>${searchResults.results.length} shown</small></div><div class="bq-search-list">${searchResults.results.map((result, index) => `<button type="button" data-search-result="${index}"><b>${escapeHtml(result.reference)}</b><span>${escapeHtml(result.text)}</span></button>`).join('')}</div>${warning}</section>`;
      };
      const renderChapter = chapter => {
        const state = reader.getState();
        const links = reader.externalLinks();
        host.innerHTML = `<section class="bq-panel bq-reader-head"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p>Bundled local Scripture packs are loaded through one v3 data service. Copyrighted translations remain external unless redistribution rights are verified.</p></section><div class="bq-reader-layout"><aside class="bq-panel bq-reader-controls"><label>Translation<select data-reader-translation>${options(reader.translations, state.translation)}</select></label><label>Book<select data-reader-book>${options(reader.books, state.book, 'code', 'name')}</select></label><label>Chapter<select data-reader-chapter>${Array.from({ length: chapter.book.chapters }, (_, index) => `<option value="${index + 1}" ${index + 1 === state.chapter ? 'selected' : ''}>${index + 1}</option>`).join('')}</select></label><div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-reader-prev>← Previous</button><button type="button" class="bq-secondary-button" data-reader-next>Next →</button></div><form class="bq-reader-search" data-reader-search><label>Search this translation<input name="query" minlength="3" placeholder="John 3:16 or a phrase" required></label><button type="submit" class="bq-primary-button">Search</button></form><p class="bq-form-message" data-reader-message aria-live="polite"></p><div class="bq-reader-source"><b>${escapeHtml(chapter.translation.source)}</b><span>${escapeHtml(chapter.translation.license)}</span><span>${escapeHtml(chapter.translation.attribution)}</span></div><div class="bq-external-links"><span>Open this passage externally</span>${links.map(link => `<a ${externalAttrs} data-external-reader="${escapeHtml(link.id)}" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div></aside><section class="bq-panel bq-scripture-panel"><div class="bq-reader-title"><div><p class="bq-eyebrow">${escapeHtml(chapter.translation.label)}</p><h2>${escapeHtml(chapter.book.name)} ${chapter.chapter}</h2></div><button type="button" class="bq-secondary-button" data-reader-mark>${reader.isRead() ? 'Marked read' : 'Mark read'}</button></div><div class="bq-verse-list">${chapter.verses.map(verse => `<button type="button" class="bq-verse ${verse.verse === highlightVerse ? 'is-highlighted' : ''}" data-verse="${verse.verse}"><span>${verse.verse}</span><p>${escapeHtml(verse.text)}</p></button>`).join('')}</div>${renderSearch()}</section></div><dialog class="bq-verse-dialog" data-verse-dialog><div data-verse-dialog-body></div><button type="button" class="bq-secondary-button" data-verse-close>Close</button></dialog>`;
        if (highlightVerse) queueMicrotask(() => host.querySelector(`[data-verse="${highlightVerse}"]`)?.scrollIntoView({ block: 'center' }));
      };
      const load = async (message = 'Loading chapter…') => {
        const id = ++operation; renderLoading(message);
        try { const chapter = await reader.load(); if (id === operation) renderChapter(chapter); }
        catch (error) { if (id === operation) renderError(error); }
      };
      const message = text => { const node = host.querySelector('[data-reader-message]'); if (node) node.textContent = text || ''; };
      const showPeek = async verse => {
        const dialog = host.querySelector('[data-verse-dialog]'); const body = host.querySelector('[data-verse-dialog-body]'); if (!dialog || !body) return;
        try { const peek = await reader.peek(verse); body.innerHTML = `<p class="bq-eyebrow">VERSE PEEK</p><h2>${escapeHtml(peek.reference)}</h2><p class="bq-peek-text">${escapeHtml(peek.text)}</p><div class="bq-external-links">${peek.links.map(link => `<a ${externalAttrs} href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>`; if (!dialog.open) dialog.showModal(); }
        catch (error) { message(error?.message || 'Could not open verse.'); }
      };
      const onChange = async event => {
        const target = event.target; searchResults = null; highlightVerse = null;
        try { if (target.matches('[data-reader-translation]')) reader.setTranslation(target.value); else if (target.matches('[data-reader-book]')) reader.setBook(target.value, 1); else if (target.matches('[data-reader-chapter]')) reader.setChapter(Number(target.value)); else return; await load(); }
        catch (error) { message(error?.message || 'Could not change passage.'); }
      };
      const onClick = async event => {
        const target = event.target instanceof Element ? event.target : null; if (!target) return;
        if (target.closest('[data-reader-retry]')) return load();
        if (target.closest('[data-reader-prev]')) { searchResults = null; highlightVerse = null; reader.move(-1); return load(); }
        if (target.closest('[data-reader-next]')) { searchResults = null; highlightVerse = null; reader.move(1); return load(); }
        const mark = target.closest('[data-reader-mark]');
        if (mark) { try { const result = reader.markRead(); mark.textContent = 'Marked read'; if (result.newlyRead) message(result.progress?.awardedXp ? `Marked read · +${result.progress.awardedXp} XP` : 'Marked read · progress already credited'); else message('Already marked read.'); } catch (error) { message(error?.message || 'Could not mark chapter read.'); } return; }
        const verse = target.closest('[data-verse]'); if (verse) return showPeek(Number(verse.dataset.verse));
        if (target.closest('[data-verse-close]')) { host.querySelector('[data-verse-dialog]')?.close(); return; }
        const resultButton = target.closest('[data-search-result]');
        if (resultButton && searchResults) { const result = searchResults.results[Number(resultButton.dataset.searchResult)]; try { renderLoading('Opening search result…'); const opened = await reader.openSearchResult(result); highlightVerse = opened.verse; searchResults = null; renderChapter(opened.chapter); } catch (error) { renderError(error); } }
      };
      const onSubmit = async event => {
        const form = event.target instanceof HTMLFormElement ? event.target : null; if (!form?.matches('[data-reader-search]')) return; event.preventDefault();
        const query = String(new FormData(form).get('query') || '').trim(); const button = form.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Searching…'; message('Searching bundled packs…');
        try { searchResults = await reader.search(query, { limit: 30 }); const chapter = await reader.load(); renderChapter(chapter); host.querySelector('.bq-search-results')?.scrollIntoView({ block: 'start' }); }
        catch (error) { message(error?.message || 'Search failed.'); button.disabled = false; button.textContent = 'Search'; }
      };
      host.addEventListener('change', onChange); host.addEventListener('click', onClick); host.addEventListener('submit', onSubmit); load();
      return () => { operation++; host.querySelector('[data-verse-dialog]')?.close(); host.removeEventListener('change', onChange); host.removeEventListener('click', onClick); host.removeEventListener('submit', onSubmit); };
    }
  };
}

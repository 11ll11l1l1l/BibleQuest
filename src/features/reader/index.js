import { createContextLab } from './context.js';
import { japaneseVocabularyBlock, japaneseVocabularyControl } from './vocabulary.js';
import { japaneseFuriganaControl, japaneseFuriganaRecoveryStatus } from './furigana.js';
import { presentReaderChapter, readerChapterHeading } from '../../v6/reader/presentation.ts';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const externalAttrs = 'target="_blank" rel="noopener noreferrer"';
const options = (items, value, key = 'id', label = 'label') => items.map(item => `<option value="${escapeHtml(item[key])}" ${item[key] === value ? 'selected' : ''}>${escapeHtml(item[label])}</option>`).join('');
const offlineStatusHtml = status => {
  if (!status) return '';
  const label = status.available ? 'Available offline' : status.supported ? 'Not available offline' : 'Online required';
  return `<div class="bq-reader-note bq-reader-offline-status" data-reader-offline-status data-offline-available="${status.available ? 'true' : 'false'}"><b>${escapeHtml(label)}</b><span>${escapeHtml(status.reason || '')}</span></div>`;
};

export function readerPage({ reader, vocabulary = null, furigana = null }) {
  return {
    title: 'Bible Reader',
    html: '<section data-reader-page><div class="bq-panel"><p>Loading Bible Reader…</p></div></section>',
    mount(root) {
      const host = root.querySelector('[data-reader-page]'); let searchResults = null, highlightVerse = null, operation = 0, furiganaPass = 0, currentChapter = null;
      const getOfflineStatus = async () => { if (typeof reader.getOfflineStatus !== 'function') return null; try { return await reader.getOfflineStatus(); } catch { return null; } };
      const renderLoading = message => { host.innerHTML = `<section class="bq-panel"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p>${escapeHtml(message)}</p></section>`; };
      const renderError = (error, offlineStatus = null) => {
        const japanese = reader.getState().translation === 'jko';
        host.innerHTML = `<section class="bq-panel"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p class="bq-form-message">${escapeHtml(error?.message || 'Could not load Scripture.')}</p>${offlineStatusHtml(offlineStatus)}${japanese ? '<p data-jko-failure>口語訳はライブの章データです。本文を推測したり別の訳で置き換えたりしません。接続を確認して再試行するか、明示的にBSBへ切り替えてください。</p>' : ''}<div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-reader-retry>Retry</button>${japanese ? '<button type="button" class="bq-secondary-button" data-reader-use-bsb>Use BSB</button>' : ''}</div></section>`;
      };
      const renderSearch = () => { if (!searchResults) return ''; const warning = searchResults.skippedBooks?.length ? `<p class="bq-reader-note">${searchResults.skippedBooks.length} book pack(s) were unavailable during this search.</p>` : ''; if (!searchResults.results.length) return `<section class="bq-search-results"><h2>Search results</h2><p>No matches found.</p>${warning}</section>`; return `<section class="bq-search-results"><div class="bq-reader-title"><h2>Search results</h2><small>${searchResults.results.length} shown</small></div><div class="bq-search-list">${searchResults.results.map((result, index) => `<button type="button" data-search-result="${index}"><b>${escapeHtml(result.reference)}</b><span>${escapeHtml(result.text)}</span></button>`).join('')}</div>${warning}</section>`; };
      const renderChapter = (chapter, offlineStatus = null) => {
        const state = reader.getState(), links = reader.externalLinks(), japanese = state.translation === 'jko', licensed = chapter.translation.mode === 'licensed-link';
        const heading = readerChapterHeading(chapter.book, chapter.chapter);
        const presentation = licensed ? null : presentReaderChapter(chapter);
        currentChapter=chapter;
        const furiganaControl = japanese && furigana ? `${japaneseFuriganaControl(furigana.getState())}<div data-jp-furigana-status aria-live="polite"></div>` : '';
        const vocabularyControl = japanese && vocabulary ? japaneseVocabularyControl(vocabulary.getState()) : '';
        const searchControl = licensed ? '<p class="bq-reader-note bq-licensed-search-note" data-licensed-search-note>NLT search stays in the licensed external reader. Choose the book and chapter here, then open that passage externally.</p>' : '<form class="bq-reader-search" data-reader-search><label>Search this translation<input name="query" minlength="3" aria-label="Search this translation" placeholder="John 3:16 or a phrase" required></label><button type="submit" class="bq-primary-button">Search</button></form>';
        const externalControl = licensed ? '' : `<div class="bq-external-links"><span>Open this passage externally</span>${links.map(link => `<a ${externalAttrs} data-external-reader="${escapeHtml(link.id)}" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>`;
        const questState=reader.questSnapshot?.()||null;
        const questTarget=questState?.next||null;
        const questMatches=Boolean(questState?.active&&questTarget&&questTarget.code===state.book&&questTarget.chapter===state.chapter);
        const questBanner=!questState?.active||questState?.complete?'':questMatches
          ? `<section class="bq-panel bq-reader-note" data-reader-quest><p class="bq-eyebrow">MAIN BIBLE QUEST</p><h3>${escapeHtml(questTarget.book)} ${questTarget.chapter}</h3><p>${questState.completedChapters}/${questState.totalChapters} chapters complete · ${questState.percent}%</p><p>Complete this chapter to advance the Genesis → Revelation Quest. Free reading elsewhere does not skip this required chapter.</p><button type="button" class="bq-primary-button" data-reader-quest-complete>${licensed?'I finished this chapter externally · Continue':'Complete Quest chapter · Continue'}</button></section>`
          : `<section class="bq-panel bq-reader-note" data-reader-quest-away><p class="bq-eyebrow">MAIN BIBLE QUEST</p><p>Your Quest is waiting at <b>${escapeHtml(questTarget.book)} ${questTarget.chapter}</b>. This page is free reading and will not move the ordered Quest.</p><button type="button" class="bq-secondary-button" data-reader-quest-return>Return to Quest chapter</button></section>`;
        const scripture = licensed ? `<section class="bq-panel bq-scripture-panel" data-licensed-reader><div class="bq-reader-title"><div><p class="bq-eyebrow">${escapeHtml(chapter.translation.label)}</p><h2>${escapeHtml(heading)}</h2></div></div><div class="bq-licensed-reader-panel"><h3>Open NLT in a licensed reader</h3><p>The New Living Translation is copyrighted. BibleQuest does not redistribute its full text or expose a private translation API key in the browser.</p><p>Your selected book and chapter remain saved in BibleQuest. The button below opens that exact passage externally.</p><a class="bq-primary-button bq-licensed-reader-link" data-nlt-open ${externalAttrs} href="${escapeHtml(chapter.external?.href || '')}">Open ${escapeHtml(heading)} · NLT</a></div></section>` : `<section class="bq-panel bq-scripture-panel"><div class="bq-reader-title"><div><p class="bq-eyebrow">${escapeHtml(chapter.translation.label)}</p><h2>${escapeHtml(heading)}</h2></div><button type="button" class="bq-secondary-button" data-reader-mark>${reader.isRead() ? 'Marked read' : 'Mark read'}</button></div><div class="bq-verse-list">${presentation.verses.map(verse => `<button type="button" class="bq-verse ${verse.verse === highlightVerse ? 'is-highlighted' : ''}" data-verse="${verse.verse}"><span>${escapeHtml(verse.label)}</span><p data-reader-verse-text>${escapeHtml(verse.text)}</p></button>`).join('')}</div>${renderSearch()}</section>`;
        host.innerHTML = `<section class="bq-panel bq-reader-head"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p>BibleQuest uses one Bible data service for bundled Scripture packs and verified live chapter sources. Copyrighted translations remain external unless redistribution rights are verified.</p></section>${questBanner}<div class="bq-reader-layout"><aside class="bq-panel bq-reader-controls"><label>Translation<select data-reader-translation>${options(reader.translations, state.translation)}</select></label><label>Book<select data-reader-book>${options(reader.books, state.book, 'code', 'name')}</select></label><label>Chapter<select data-reader-chapter>${Array.from({ length: chapter.book.chapters }, (_, index) => `<option value="${index + 1}" ${index + 1 === state.chapter ? 'selected' : ''}>${index + 1}</option>`).join('')}</select></label>${offlineStatusHtml(offlineStatus)}<div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-reader-prev>← Previous</button><button type="button" class="bq-secondary-button" data-reader-next>Next →</button></div><button type="button" class="bq-secondary-button bq-reader-context-button" data-reader-context>אΩ Hebrew / Greek context</button>${furiganaControl}${vocabularyControl}${searchControl}<p class="bq-form-message" data-reader-message aria-live="polite"></p><div class="bq-reader-source"><b>${escapeHtml(chapter.translation.source)}</b><span>${escapeHtml(chapter.translation.license)}</span><span>${escapeHtml(chapter.translation.attribution)}</span></div>${externalControl}</aside>${scripture}</div><dialog class="bq-verse-dialog" data-verse-dialog><div data-verse-dialog-body></div><button type="button" class="bq-secondary-button" data-verse-close>Close</button></dialog><dialog class="bq-context-dialog" data-context-dialog></dialog>`;
        void applyFurigana(chapter,japanese);
        if (highlightVerse && !licensed) queueMicrotask(() => host.querySelector(`[data-verse="${highlightVerse}"]`)?.scrollIntoView({ block: 'center' }));
      };
      const applyFurigana = async (chapter,japanese,{retrying=false}={}) => {
        const pass=++furiganaPass;
        if(!japanese||!furigana||chapter.translation.mode==='licensed-link') return;
        const status=host.querySelector('[data-jp-furigana-status]');
        if(status) status.innerHTML=japaneseFuriganaRecoveryStatus({retrying});
        const rendered=await Promise.all(chapter.verses.map(async verse=>{try{return {verse:verse.verse,...await furigana.render(verse.text)}}catch{return {verse:verse.verse,html:escapeHtml(verse.text),fallback:true}}}));
        if(pass!==furiganaPass||reader.getState().translation!=='jko') return;
        let fallback=false;
        for(const row of rendered){fallback=Boolean(fallback||row.fallback);const node=host.querySelector(`[data-verse="${row.verse}"] [data-reader-verse-text]`);if(node) node.innerHTML=row.html}
        if(status) status.innerHTML=japaneseFuriganaRecoveryStatus({fallback});
      };
      const load = async (message = 'Loading chapter…') => { const id = ++operation; renderLoading(message); try { const chapter = await reader.load(); const offlineStatus = await getOfflineStatus(); if (id === operation) renderChapter(chapter, offlineStatus); } catch (error) { const offlineStatus = await getOfflineStatus(); if (id === operation) renderError(error, offlineStatus); } };
      const message = text => { const node = host.querySelector('[data-reader-message]'); if (node) node.textContent = text || ''; };
      const openContext = async params => { const dialog = host.querySelector('[data-context-dialog]'); if (!dialog) return; const lab = createContextLab({ reader, dialog }); await lab.open(params); };
      const showPeek = async verse => {
        const dialog = host.querySelector('[data-verse-dialog]'), body = host.querySelector('[data-verse-dialog-body]'); if (!dialog || !body) return;
        try {
          const peek = await reader.peek(verse), japanese = reader.getState().translation === 'jko', vocabularyState = vocabulary?.getState();
          const vocabularyHtml = japanese && vocabulary && vocabularyState?.enabled ? japaneseVocabularyBlock({notes:vocabulary.notesFor(peek.text)}) : '';
          dialog.dataset.peekVerse = String(peek.verse);
          body.innerHTML = `<p class="bq-eyebrow">VERSE PEEK</p><h2>${escapeHtml(peek.reference)}</h2><p class="bq-peek-text">${escapeHtml(peek.text)}</p>${vocabularyHtml}<button type="button" class="bq-secondary-button bq-peek-context-button" data-peek-context>אΩ Hebrew / Greek context</button><div class="bq-external-links">${peek.links.map(link => `<a ${externalAttrs} href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>`;
          if (!dialog.open) dialog.showModal();
        } catch (error) { message(error?.message || 'Could not open verse.'); }
      };
      const onChange = async event => { const target = event.target; searchResults = null; highlightVerse = null; try { if (target.matches('[data-reader-furigana]') && furigana) { furigana.setMode(target.value); if(currentChapter) renderChapter(currentChapter, await getOfflineStatus()); return; } if (target.matches('[data-reader-translation]')) reader.setTranslation(target.value); else if (target.matches('[data-reader-book]')) reader.setBook(target.value, 1); else if (target.matches('[data-reader-chapter]')) reader.setChapter(Number(target.value)); else return; await load(); } catch (error) { message(error?.message || 'Could not change passage.'); } };
      const onClick = async event => {
        const target = event.target instanceof Element ? event.target : null; if (!target) return;
        if (target.closest('[data-reader-retry]')) return load();
        if (target.closest('[data-reader-use-bsb]')) { reader.setTranslation('bsb'); searchResults = null; highlightVerse = null; return load('Loading BSB…'); }
        if (target.closest('[data-reader-furigana-retry]') && currentChapter && reader.getState().translation === 'jko') { await applyFurigana(currentChapter, true, { retrying: true }); return; }
        if (target.closest('[data-reader-prev]')) { searchResults = null; highlightVerse = null; reader.move(-1); return load(); }
        if (target.closest('[data-reader-next]')) { searchResults = null; highlightVerse = null; reader.move(1); return load(); }
        if (target.closest('[data-reader-quest-return]') && reader.activateQuestNext) {
          const quest=reader.activateQuestNext(), next=quest?.next;
          if(next){ searchResults=null; highlightVerse=null; reader.setBook(next.code,next.chapter); return load('Returning to Bible Quest…'); }
          return;
        }
        if (target.closest('[data-reader-quest-complete]') && reader.completeQuestChapter) {
          try {
            const state=reader.getState();
            const source=currentChapter?.translation?.mode==='licensed-link'?'external-self-report':'reader';
            reader.completeQuestChapter(source);
            const quest=reader.activateQuestNext(), next=quest?.next;
            if(next){ searchResults=null; highlightVerse=null; reader.setBook(next.code,next.chapter); return load('Opening next Bible Quest chapter…'); }
            return load('Bible Quest complete.');
          } catch(error) { message(error?.message || 'Could not advance Bible Quest.'); }
          return;
        }
        if (target.closest('[data-reader-context]')) { const state = reader.getState(); return openContext({ code: state.book, chapter: state.chapter, verse: 1 }); }
        const vocabToggle = target.closest('[data-jp-vocab-toggle]');
        if (vocabToggle && vocabulary) { const next = vocabulary.setEnabled(!vocabulary.getState().enabled); vocabToggle.outerHTML = japaneseVocabularyControl(next); message(next.enabled ? 'Japanese vocabulary notes enabled.' : 'Japanese vocabulary notes disabled.'); return; }
        const mark = target.closest('[data-reader-mark]'); if (mark) { try { const result = reader.markRead(); mark.textContent = 'Marked read'; if (result.newlyRead) message(result.progress?.awardedXp ? `Marked read · +${result.progress.awardedXp} XP` : 'Marked read · progress already credited'); else message('Already marked read.'); } catch (error) { message(error?.message || 'Could not mark chapter read.'); } return; }
        const verse = target.closest('[data-verse]'); if (verse) return showPeek(Number(verse.dataset.verse));
        if (target.closest('[data-peek-context]')) { const dialog = host.querySelector('[data-verse-dialog]'), verseNumber = Number(dialog?.dataset.peekVerse); dialog?.close(); const state = reader.getState(); return openContext({ code: state.book, chapter: state.chapter, verse: verseNumber }); }
        if (target.closest('[data-verse-close]')) { host.querySelector('[data-verse-dialog]')?.close(); return; }
        const resultButton = target.closest('[data-search-result]'); if (resultButton && searchResults) { const result = searchResults.results[Number(resultButton.dataset.searchResult)]; try { renderLoading('Opening search result…'); const opened = await reader.openSearchResult(result); highlightVerse = opened.verse; searchResults = null; renderChapter(opened.chapter, await getOfflineStatus()); } catch (error) { renderError(error, await getOfflineStatus()); } }
      };
      const onSubmit = async event => { const form = event.target instanceof HTMLFormElement ? event.target : null; if (!form?.matches('[data-reader-search]')) return; event.preventDefault(); const query = String(new FormData(form).get('query') || '').trim(), button = form.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Searching…'; message('Searching Scripture source…'); try { searchResults = await reader.search(query, { limit: 30 }); const chapter = await reader.load(); renderChapter(chapter, await getOfflineStatus()); host.querySelector('.bq-search-results')?.scrollIntoView({ block: 'start' }); } catch (error) { message(error?.message || 'Search failed.'); button.disabled = false; button.textContent = 'Search'; } };
      host.addEventListener('change', onChange); host.addEventListener('click', onClick); host.addEventListener('submit', onSubmit); load();
      return () => { operation++; furiganaPass++; host.querySelector('[data-verse-dialog]')?.close(); host.querySelector('[data-context-dialog]')?.close(); host.removeEventListener('change', onChange); host.removeEventListener('click', onClick); host.removeEventListener('submit', onSubmit); };
    }
  };
}
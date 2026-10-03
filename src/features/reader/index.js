import { createContextLab } from './context.js';
import { japaneseVocabularyBlock, japaneseVocabularyControl } from './vocabulary.js';
import { japaneseFuriganaControl } from './furigana.js';
import { japaneseFuriganaRecoveryStatus } from './furigana.js';
import { presentReaderChapter, readerChapterHeading, renderReaderChapterPresentation } from '../../v6/reader/presentation.ts';
import { presentReaderSearchResults } from '../../v6/reader/search-presentation.ts';
import { presentReaderVersePeek } from '../../v6/reader/verse-peek-presentation.ts';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const externalAttrs = 'target="_blank" rel="noopener noreferrer"';
const options = (items, value, key = 'id', label = 'label') => items.map(item => `<option value="${escapeHtml(item[key])}" ${item[key] === value ? 'selected' : ''}>${escapeHtml(item[label])}</option>`).join('');
const formatAudioTime = value => { const seconds = Math.max(0, Math.floor(Number(value) || 0)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
const offlineStatusHtml = status => {
  if (!status) return '';
  const label = status.available ? 'Available offline' : status.supported ? 'Not available offline' : 'Online required';
  return `<div class="bq-reader-note bq-reader-offline-status" data-reader-offline-status data-offline-available="${status.available ? 'true' : 'false'}"><b>${escapeHtml(label)}</b><span>${escapeHtml(status.reason || '')}</span></div>`;
};

const readerAudioHtml = (audio, state, licensed) => {
  if (!audio?.isAvailable?.() || state.translation !== 'bsb' || licensed) return '';
  const playback = audio.getState?.().playback;
  const status = playback?.status === 'playing' ? 'Playing' : playback?.status === 'paused' ? 'Paused' : playback?.status === 'error' ? playback.error : 'Ready to play';
  const rate = playback?.playbackRate || 1;
  const narrators = audio.getNarrators?.() || [];
  const narratorControl = narrators.length > 1 ? `<label>Narrator<select data-reader-audio-narrator aria-label="Audio narrator">${options(narrators, audio.getNarrator?.(), 'id', 'label')}</select></label>` : '';
  const verseAlignment = Boolean(audio.hasVerseAlignment?.(state.book, state.chapter));
  const verseFollowControl = `<label class="bq-reader-audio__follow"><input type="checkbox" data-reader-audio-follow ${verseAlignment ? 'checked' : 'disabled'}><span>Follow verse</span></label>`;
  return `<section class="bq-reader-audio" data-reader-audio-player aria-label="BSB Audio Bible"><button type="button" class="bq-reader-audio__play" data-reader-audio-toggle aria-label="${playback?.status === 'playing' ? 'Pause audio' : playback?.status === 'error' ? 'Retry audio' : 'Play chapter audio'}">${playback?.status === 'playing' ? 'Ⅱ' : '▶'}</button><span class="bq-reader-audio__title"><b>${escapeHtml(state.book)} ${state.chapter}</b><small data-reader-audio-status role="status" aria-live="polite">${escapeHtml(status)}</small></span><label class="bq-reader-audio-position"><span data-reader-audio-time>${formatAudioTime(playback?.currentTime)} / ${playback?.duration ? formatAudioTime(playback.duration) : '--:--'}</span><input type="range" min="0" max="${playback?.duration || 0}" step="0.1" value="${playback?.currentTime || 0}" data-reader-audio-position aria-label="Audio position" ${playback?.duration ? '' : 'disabled'}></label>${verseFollowControl}<details class="bq-reader-audio__more"><summary aria-label="Audio options">•••</summary><div class="bq-reader-audio-controls">${narratorControl}<label>Speed<select data-reader-audio-speed aria-label="Audio playback speed">${[0.75, 1, 1.25, 1.5, 1.75, 2].map(value => `<option value="${value}" ${value === rate ? 'selected' : ''}>${value}×</option>`).join('')}</select></label><label><input type="checkbox" data-reader-audio-auto-next ${playback?.autoNext ? 'checked' : ''}> Auto-next</label><label>Sleep timer<select data-reader-audio-timer aria-label="Audio sleep timer"><option value="0">Off</option>${[15, 30, 60, 90, 120].map(value => `<option value="${value}" ${playback?.sleepTimerMinutes === value ? 'selected' : ''}>${value} min</option>`).join('')}</select></label></div></details><div class="bq-reader-audio__offline" data-reader-audio-package aria-live="polite"><span>Checking offline audio…</span></div></section>`;
};

const readerSpeechHtml = (speech, state, licensed) => {
  if (!speech?.isAvailable?.() || licensed || !['tl', 'cebocb', 'jko'].includes(state.translation)) return '';
  const playback = speech.getState?.();
  const status = playback?.status === 'speaking' ? 'Reading aloud' : playback?.status === 'paused' ? 'Paused' : playback?.status === 'error' ? playback.error : 'Ready';
  const action = playback?.status === 'speaking' ? 'Pause reading' : playback?.status === 'paused' ? 'Resume reading' : playback?.status === 'ended' ? 'Read chapter again' : 'Read chapter aloud';
  return `<section class="bq-reader-speech" data-reader-speech aria-label="Browser speech reading"><b>Read aloud · browser voice</b><span data-reader-speech-status role="status" aria-live="polite">${escapeHtml(status)}</span><div class="bq-reader-speech-controls"><button type="button" class="bq-secondary-button" data-reader-speech-toggle>${action}</button><button type="button" class="bq-secondary-button" data-reader-speech-stop ${['speaking', 'paused'].includes(playback?.status) ? '' : 'disabled'}>Stop reading</button><label>Speed<select data-reader-speech-rate aria-label="Speech reading speed">${[0.75, 1, 1.25, 1.5, 1.75, 2].map(value => `<option value="${value}" ${value === (playback?.playbackRate || 1) ? 'selected' : ''}>${value}×</option>`).join('')}</select></label></div><small>Uses the browser’s default speech service, which may be local or remote. Voice and language support vary.</small></section>`;
};

const formatBytes = value => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

const offlinePackageHtml = (snapshot, active = false, inventory = [], translation = null, activeTranslation = null) => {
  if (!snapshot) return '<p class="bq-reader-note">Checking managed offline storage…</p>';
  const usage = `${formatBytes(snapshot.usage?.bytes || 0)} · ${Number(snapshot.usage?.packages || 0)} managed book(s)`;
  const others = inventory.filter(item => !(item.translationId === snapshot.translationId && item.bookCode === snapshot.bookCode));
  const inventoryHtml = `<details class="bq-reader-offline-inventory"><summary>Downloaded Bible books (${Number(snapshot.usage?.packages || 0)})</summary>${others.length ? `<ul>${others.map(item => `<li><span><b>${escapeHtml(item.translationId.toUpperCase())} · ${escapeHtml(item.bookCode)}</b><small>${escapeHtml(formatBytes(item.bytes))}</small></span><button type="button" class="bq-secondary-button" data-reader-offline-remove-package data-translation="${escapeHtml(item.translationId)}" data-book="${escapeHtml(item.bookCode)}" aria-label="Remove ${escapeHtml(item.translationId.toUpperCase())} ${escapeHtml(item.bookCode)} offline book">Remove</button></li>`).join('')}</ul>` : '<p class="bq-reader-note">Other downloaded books will appear here.</p>'}</details>`;
  const bulkDownload = !translation?.downloadable ? '' : activeTranslation?.translationId === snapshot.translationId
    ? `<section data-reader-offline-translation><b>Downloading full ${escapeHtml(snapshot.translationId.toUpperCase())} translation</b><progress data-reader-translation-progress max="100"></progress><span data-reader-translation-progress-text>Preparing book 1 of ${translation.totalBooks}…</span><button type="button" class="bq-secondary-button" data-reader-translation-cancel>Cancel full translation download</button></section>`
    : `<section data-reader-offline-translation><b>Full translation · ${translation.installedBooks}/${translation.totalBooks} books</b><small>${escapeHtml(formatBytes(translation.totalBytes))} total · ${escapeHtml(formatBytes(translation.installedBytes))} installed</small>${translation.installedBooks === translation.totalBooks
      ? '<button type="button" class="bq-secondary-button" data-reader-translation-remove>Remove full translation</button>'
      : `<button type="button" class="bq-secondary-button" data-reader-translation-download>${translation.installedBooks ? 'Download remaining books' : 'Download full translation'}</button>`}</section>`;
  if (!snapshot.downloadable) {
    return `<div class="bq-reader-offline-manager" data-reader-offline-manager data-managed-installed="false"><b>Managed offline downloads</b><span>${escapeHtml(snapshot.reason || 'This translation is not downloadable.')}</span><small>Storage: ${escapeHtml(usage)}</small>${bulkDownload}${inventoryHtml}</div>`;
  }
  if (active) {
    return `<div class="bq-reader-offline-manager" data-reader-offline-manager data-managed-installed="${snapshot.installed ? 'true' : 'false'}"><b>Downloading verified book…</b><progress data-reader-offline-progress-bar max="100"></progress><span data-reader-offline-progress-text>Preparing download…</span><button type="button" class="bq-secondary-button" data-reader-offline-cancel>Cancel</button><small>Storage: ${escapeHtml(usage)}</small>${bulkDownload}${inventoryHtml}</div>`;
  }
  if (snapshot.installed && !snapshot.updateAvailable) {
    return `<div class="bq-reader-offline-manager" data-reader-offline-manager data-managed-installed="true"><b>Managed offline copy</b><span>${escapeHtml(snapshot.reason || 'Installed and verified.')}</span><small>${escapeHtml(formatBytes(snapshot.installed.bytes))} · Storage: ${escapeHtml(usage)}</small><button type="button" class="bq-secondary-button" data-reader-offline-remove>Remove offline book</button>${bulkDownload}${inventoryHtml}</div>`;
  }
  const size = snapshot.packageBytes ? ` · ${formatBytes(snapshot.packageBytes)}` : '';
  const action = snapshot.updateAvailable ? 'Update offline book' : 'Download this book';
  return `<div class="bq-reader-offline-manager" data-reader-offline-manager data-managed-installed="false" data-offline-update-available="${snapshot.updateAvailable ? 'true' : 'false'}"><b>Managed offline copy</b><span>${escapeHtml(snapshot.reason || 'Download this book for offline use.')}</span><small>Current book${escapeHtml(size)} · Storage: ${escapeHtml(usage)}</small><button type="button" class="bq-secondary-button" data-reader-offline-download>${action}</button>${bulkDownload}${inventoryHtml}</div>`;
};

export function readerPage({ reader, vocabulary = null, furigana = null, offlinePackages = null, audio = null, speech = null }) {
  return {
    title: 'Bible Reader',
    html: '<section data-reader-page><div class="bq-panel"><p>Loading Bible Reader…</p></div></section>',
    mount(root) {
      const host = root.querySelector('[data-reader-page]'); let searchResults = null, highlightVerse = null, operation = 0, furiganaPass = 0, currentChapter = null, activeOfflineDownload = null, activeOfflineTranslation = null, offlineInventory = null;
      const getOfflineStatus = async () => { if (typeof reader.getOfflineStatus !== 'function') return null; try { return await reader.getOfflineStatus(); } catch { return null; } };
      const activeOfflineKey = state => activeOfflineDownload && activeOfflineDownload.translationId === state.translation && activeOfflineDownload.bookCode === state.book;
      const renderOfflinePackageControls = async () => {
        const container = host.querySelector('[data-reader-offline-package]');
        if (!container || !offlinePackages?.snapshot) return;
        const state = reader.getState(), expectedKey = `${state.translation}:${state.book}`;
        try {
          const snapshot = await offlinePackages.snapshot(state.translation, state.book);
          const translationSnapshot = offlinePackages.translationSnapshot
            ? await offlinePackages.translationSnapshot(state.translation)
            : null;
          if (!offlineInventory) offlineInventory = await offlinePackages.listInstalled();
          const latest = reader.getState();
          if (`${latest.translation}:${latest.book}` !== expectedKey || !container.isConnected) return;
          container.innerHTML = offlinePackageHtml(snapshot, Boolean(activeOfflineKey(latest)), offlineInventory, translationSnapshot, activeOfflineTranslation);
        } catch (error) {
          if (container.isConnected) container.innerHTML = `<p class="bq-reader-note bq-form-message">${escapeHtml(error?.message || 'Managed offline storage is unavailable.')}</p>`;
        }
      };
      const updateOfflineProgress = progress => {
        const bar = host.querySelector('[data-reader-offline-progress-bar]');
        const text = host.querySelector('[data-reader-offline-progress-text]');
        if (bar) {
          if (progress?.ratio === null || progress?.ratio === undefined) bar.removeAttribute('value');
          else bar.value = Math.round(progress.ratio * 100);
        }
        if (text) {
          const phase = progress?.phase === 'verifying' ? 'Verifying' : progress?.phase === 'storing' ? 'Saving' : 'Downloading';
          const amount = progress?.totalBytes ? `${formatBytes(progress.receivedBytes)} / ${formatBytes(progress.totalBytes)}` : formatBytes(progress?.receivedBytes || 0);
          text.textContent = `${phase} · ${amount}`;
        }
      };
      const updateOfflineTranslationProgress = progress => {
        const bar = host.querySelector('[data-reader-translation-progress]');
        const text = host.querySelector('[data-reader-translation-progress-text]');
        if (bar) {
          if (progress?.ratio === null || progress?.ratio === undefined) bar.removeAttribute('value');
          else bar.value = Math.round(progress.ratio * 100);
        }
        if (text) {
          const completed = Number(progress?.completedBooks || 0);
          const current = progress?.phase === 'complete' ? completed : completed + 1;
          const phase = progress?.phase === 'verifying' ? 'Verifying' : progress?.phase === 'storing' ? 'Saving' : progress?.phase === 'complete' ? 'Complete' : 'Downloading';
          text.textContent = `${phase} · book ${Math.min(current, progress?.totalBooks || current)} of ${progress?.totalBooks || current} · ${progress?.currentBookCode || ''}`;
        }
      };
      let activeAudioDownload = null, activeAudioProgress = null, audioPassageSync = null, audioFollowVerse = true, lastAudioFollowKey = null;
      const unavailableAudioDownloads = new Set();
      const audioDownloadKey = state => `${audio?.getNarrator?.() || 'default'}:${state.book}:${state.chapter}`;
      const refreshAudioPackage = async () => {
        const container = host.querySelector('[data-reader-audio-package]');
        if (!container || !audio?.getInstalledPackage) return;
        const state = reader.getState(), key = `${state.book}:${state.chapter}`;
        try {
          if (activeAudioDownload) {
            const matches = activeAudioDownload.key === key;
            const p = activeAudioProgress;
            container.innerHTML = `${matches ? '<b>Downloading this chapter audio</b>' : `<span>Downloading ${escapeHtml(activeAudioDownload.book)} ${activeAudioDownload.chapter} audio</span>`}<progress data-reader-audio-progress max="100" ${p?.ratio == null ? '' : `value="${Math.round(p.ratio * 100)}"`}></progress><span data-reader-audio-progress-text>${p ? `${escapeHtml(p.phase)} · ${escapeHtml(formatBytes(p.receivedBytes))} / ${escapeHtml(formatBytes(p.totalBytes))}` : 'Preparing download…'}</span><button type="button" class="bq-secondary-button" data-reader-audio-cancel data-book="${escapeHtml(activeAudioDownload.book)}" data-chapter="${activeAudioDownload.chapter}">Cancel download</button>`;
            return;
          }
          const installed = await audio.getInstalledPackage(state.book, state.chapter);
          const latest = reader.getState();
          if (!container.isConnected || `${latest.book}:${latest.chapter}` !== key) return;
          const downloadUnavailable = unavailableAudioDownloads.has(audioDownloadKey(state));
          container.innerHTML = installed
            ? `<span>Offline audio installed · ${escapeHtml(formatBytes(installed.bytes))}</span><button type="button" class="bq-secondary-button" data-reader-audio-remove>Remove chapter audio</button>`
            : audio.canDownloadOffline?.() === false
              ? '<span>Offline download is not approved for this audio source. Streaming requires an internet connection.</span>'
              : downloadUnavailable
                ? '<span data-reader-audio-download-unavailable>Offline audio download is unavailable from this source in this browser. Direct streaming remains usable.</span><button type="button" class="bq-secondary-button" data-reader-audio-download>Retry download</button>'
                : `<span>Download ${escapeHtml(state.book)} ${state.chapter} audio for offline playback</span><button type="button" class="bq-secondary-button" data-reader-audio-download>Download chapter audio</button>`;
        } catch (error) {
          if (container.isConnected) container.innerHTML = `<span>${escapeHtml(error?.message || 'Offline audio status is unavailable.')}</span>`;
        }
      };
      const refreshAudioPresentation = () => {
        if (!audio) return;
        const snapshot = audio.getState?.(), playback = snapshot?.playback;
        const selected = reader.getState();
        const shouldFollowAudio = playback?.status === 'playing'
          && playback.autoNext === true
          && selected.translation === playback.translationId
          && (selected.book !== playback.bookCode || selected.chapter !== playback.chapter);
        if (shouldFollowAudio) {
          const key = `${playback.translationId}:${playback.bookCode}:${playback.chapter}`;
          if (audioPassageSync !== key) {
            audioPassageSync = key;
            searchResults = null;
            highlightVerse = null;
            try {
              reader.setBook(playback.bookCode, playback.chapter);
              void load('Loading next audio chapter…').finally(() => {
                if (audioPassageSync === key) audioPassageSync = null;
              });
            } catch (error) {
              audio.pause();
              audioPassageSync = null;
              queueMicrotask(() => message(error?.message || 'Could not follow audio to the next chapter.'));
            }
          }
          return;
        }
        const toggle = host.querySelector('[data-reader-audio-toggle]');
        const status = host.querySelector('[data-reader-audio-status]');
        const speed = host.querySelector('[data-reader-audio-speed]');
        const autoNext = host.querySelector('[data-reader-audio-auto-next]');
        const timer = host.querySelector('[data-reader-audio-timer]');
        const position = host.querySelector('[data-reader-audio-position]');
        const time = host.querySelector('[data-reader-audio-time]');
        const narrator = host.querySelector('[data-reader-audio-narrator]');
        const followVerse = host.querySelector('[data-reader-audio-follow]');
        if (toggle) {
          const action = playback?.status === 'playing' ? 'Pause audio' : playback?.status === 'error' ? 'Retry audio' : 'Play chapter audio';
          toggle.textContent = playback?.status === 'playing' ? 'Ⅱ' : '▶';
          toggle.setAttribute('aria-label', action);
        }
        if (status) status.textContent = playback?.status === 'error' ? playback.error : playback?.status === 'playing' ? `Playing ${playback.bookCode} ${playback.chapter}${playback.currentVerse ? ` · verse ${playback.currentVerse}` : ''}` : playback?.status === 'paused' ? 'Paused' : playback?.status === 'ready' ? 'Ready to play' : 'Ready to play';
        if (speed && playback) speed.value = String(playback.playbackRate);
        if (autoNext && playback) autoNext.checked = playback.autoNext;
        if (timer && playback) timer.value = String(playback.sleepTimerMinutes || 0);
        if (position && playback) { position.max = String(playback.duration || 0); if (!position.matches(':active')) position.value = String(playback.currentTime || 0); position.disabled = !(playback.duration && playback.duration > 0); }
        if (time && playback) time.textContent = `${formatAudioTime(playback.currentTime)} / ${playback.duration ? formatAudioTime(playback.duration) : '--:--'}`;
        if (narrator) narrator.value = audio.getNarrator?.() || '';
        if (followVerse && !followVerse.disabled) followVerse.checked = audioFollowVerse;
        let activeVerseNode = null;
        host.querySelectorAll('[data-verse]').forEach(node => {
          const active = playback?.currentVerse === Number(node.dataset.verse) && playback.bookCode === selected.book && playback.chapter === selected.chapter && selected.translation === playback.translationId;
          node.classList.toggle('is-audio-current', active);
          node.setAttribute('aria-pressed', active ? 'true' : 'false');
          if (active) activeVerseNode = node;
        });
        const followKey = playback?.currentVerse ? `${playback.translationId}:${playback.bookCode}:${playback.chapter}:${playback.currentVerse}` : null;
        if (!followKey) lastAudioFollowKey = null;
        if (audioFollowVerse && playback?.status === 'playing' && activeVerseNode && followKey && followKey !== lastAudioFollowKey) {
          lastAudioFollowKey = followKey;
          const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
          queueMicrotask(() => {
            if (activeVerseNode?.isConnected) activeVerseNode.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
          });
        }
      };
      const refreshSpeechPresentation = () => {
        if (!speech?.isAvailable?.()) return;
        const snapshot = speech.getState?.();
        const toggle = host.querySelector('[data-reader-speech-toggle]');
        const stop = host.querySelector('[data-reader-speech-stop]');
        const status = host.querySelector('[data-reader-speech-status]');
        const rate = host.querySelector('[data-reader-speech-rate]');
        if (toggle) toggle.textContent = snapshot?.status === 'speaking' ? 'Pause reading'
          : snapshot?.status === 'paused' ? 'Resume reading'
            : snapshot?.status === 'ended' ? 'Read chapter again' : 'Read chapter aloud';
        if (stop) stop.disabled = !['speaking', 'paused'].includes(snapshot?.status);
        if (status) status.textContent = snapshot?.status === 'error' ? snapshot.error
          : snapshot?.status === 'speaking' ? `Reading verse ${snapshot.currentVerse ?? ''}`
            : snapshot?.status === 'paused' ? 'Paused' : snapshot?.status === 'ended' ? 'Chapter finished' : 'Ready';
        if (rate && snapshot) rate.value = String(snapshot.playbackRate);
        host.querySelectorAll('[data-verse]').forEach(node => {
          const active = snapshot?.currentVerse === Number(node.dataset.verse)
            && snapshot.bookCode === reader.getState().book && snapshot.chapter === reader.getState().chapter
            && snapshot.translationId === reader.getState().translation;
          node.classList.toggle('is-speech-current', active);
        });
      };
      const renderLoading = message => { host.innerHTML = `<section class="bq-panel"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p>${escapeHtml(message)}</p></section>`; };
      const renderError = (error, offlineStatus = null) => {
        const japanese = reader.getState().translation === 'jko';
        host.innerHTML = `<section class="bq-panel"><p class="bq-eyebrow">BIBLE READER</p><h1>Bible Reader</h1><p class="bq-form-message">${escapeHtml(error?.message || 'Could not load Scripture.')}</p>${offlineStatusHtml(offlineStatus)}${japanese ? '<p data-jko-failure>口語訳はライブの章データです。本文を推測したり別の訳で置き換えたりしません。接続を確認して再試行するか、明示的にBSBへ切り替えてください。</p>' : ''}<div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-reader-retry>Retry</button>${japanese ? '<button type="button" class="bq-secondary-button" data-reader-use-bsb>Use BSB</button>' : ''}</div></section>`;
      };
      const renderSearch = () => {
        if (!searchResults) return '';
        const presentation = presentReaderSearchResults(searchResults);
        const warning = presentation.warning ? `<p class="bq-reader-note">${escapeHtml(presentation.warning)}</p>` : '';
        if (!presentation.items.length) return `<section class="bq-search-results" aria-labelledby="bq-reader-search-results-title"><h2 id="bq-reader-search-results-title">${escapeHtml(presentation.heading)}</h2><p>${escapeHtml(presentation.emptyMessage || 'No matches found.')}</p>${warning}</section>`;
        return `<section class="bq-search-results" aria-labelledby="bq-reader-search-results-title"><div class="bq-reader-title"><h2 id="bq-reader-search-results-title">${escapeHtml(presentation.heading)}</h2><small>${escapeHtml(presentation.countLabel || '')}</small></div><div class="bq-search-list">${presentation.items.map(item => `<button type="button" data-search-result="${item.index}"><b>${escapeHtml(item.reference)}</b><span>${escapeHtml(item.text)}</span></button>`).join('')}</div>${warning}</section>`;
      };
      const renderChapter = (chapter, offlineStatus = null) => {
        const state = reader.getState(), links = reader.externalLinks(), japanese = state.translation === 'jko', licensed = chapter.translation.mode === 'licensed-link';
        const heading = readerChapterHeading(chapter.book, chapter.chapter);
        const presentation = licensed ? null : presentReaderChapter(chapter);
        currentChapter=chapter;
        if (speech?.isAvailable?.()) {
          if (!licensed && ['tl', 'cebocb', 'jko'].includes(state.translation)) speech.loadChapter(chapter);
          else speech.stop();
        }
        const furiganaControl = japanese && furigana ? `${japaneseFuriganaControl(furigana.getState())}<div data-reader-furigana-status aria-live="polite"></div>` : '';
        const vocabularyControl = japanese && vocabulary ? japaneseVocabularyControl(vocabulary.getState()) : '';
        const searchControl = licensed ? '<p class="bq-reader-note bq-licensed-search-note" data-licensed-search-note>NLT search stays in the licensed external reader. Choose the book and chapter here, then open that passage externally.</p>' : '<form class="bq-reader-search" data-reader-search><label>Search this translation<input name="query" minlength="3" aria-label="Search this translation" placeholder="John 3:16 or a phrase" required></label><button type="submit" class="bq-primary-button">Search</button></form>';
        const externalControl = licensed ? '' : `<div class="bq-external-links"><span>Open this passage externally</span>${links.map(link => `<a ${externalAttrs} data-external-reader="${escapeHtml(link.id)}" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>`;
        const questState=reader.questSnapshot?.()||null;
        const questTarget=questState?.next||null;
        const questMatches=Boolean(questState?.active&&questTarget&&questTarget.code===state.book&&questTarget.chapter===state.chapter);
        const questBanner=!questState?.active||questState?.complete?'':questMatches
          ? `<section class="bq-panel bq-reader-note" data-reader-quest><p class="bq-eyebrow">MAIN BIBLE QUEST</p><h3>${escapeHtml(questTarget.book)} ${questTarget.chapter}</h3><p>${questState.completedChapters}/${questState.totalChapters} chapters complete · ${questState.percent}%</p><p>Complete this chapter to advance the Genesis → Revelation Quest. Free reading elsewhere does not skip this required chapter.</p><button type="button" class="bq-primary-button" data-reader-quest-complete>${licensed?'I finished this chapter externally · Continue':'Complete Quest chapter · Continue'}</button></section>`
          : `<section class="bq-panel bq-reader-note" data-reader-quest-away><p class="bq-eyebrow">MAIN BIBLE QUEST</p><p>Your Quest is waiting at <b>${escapeHtml(questTarget.book)} ${questTarget.chapter}</b>. This page is free reading and will not move the ordered Quest.</p><button type="button" class="bq-secondary-button" data-reader-quest-return>Return to Quest chapter</button></section>`;
        const scripture = licensed ? `<section class="bq-panel bq-scripture-panel" data-licensed-reader><div class="bq-reader-title"><div><p class="bq-eyebrow">${escapeHtml(chapter.translation.label)}</p><h2>${escapeHtml(heading)}</h2></div></div><div class="bq-licensed-reader-panel"><h3>Open NLT in a licensed reader</h3><p>The New Living Translation is copyrighted. BibleQuest does not redistribute its full text or expose a private translation API key in the browser.</p><p>Your selected book and chapter remain saved in BibleQuest. The button below opens that exact passage externally.</p><a class="bq-primary-button bq-licensed-reader-link" data-nlt-open ${externalAttrs} href="${escapeHtml(chapter.external?.href || '')}">Open ${escapeHtml(heading)} · NLT</a></div></section>` : `<section class="bq-panel bq-scripture-panel">${renderReaderChapterPresentation(presentation, { translationLabel: chapter.translation.label, highlightedVerse: highlightVerse, isRead: reader.isRead() })}${renderSearch()}</section>`;
        host.innerHTML = `<header class="bq-reader-passage"><label><span class="bq-reader-passage__book">${escapeHtml(heading)} <span aria-hidden="true">⌄</span></span><select data-reader-book aria-label="Book">${options(reader.books, state.book, 'code', 'name')}</select></label><label><span>${escapeHtml(chapter.translation.label)} · ${escapeHtml(chapter.translation.language || 'English')}</span><select data-reader-translation aria-label="Translation">${options(reader.translations, state.translation)}</select></label><label class="bq-reader-passage__chapter"><span>Chapter</span><select data-reader-chapter aria-label="Chapter">${Array.from({ length: chapter.book.chapters }, (_, index) => `<option value="${index + 1}" ${index + 1 === state.chapter ? 'selected' : ''}>${index + 1}</option>`).join('')}</select></label></header>${questBanner}<div class="bq-reader-layout">${scripture}<aside class="bq-reader-controls"><div class="bq-reader-toolbar" aria-label="Reader tools">${searchControl}<button type="button" data-reader-context>אΩ <span>Context</span></button>${furiganaControl}${vocabularyControl}</div><details class="bq-reader-settings"><summary>Reading and offline settings</summary>${readerSpeechHtml(speech, state, licensed)}${offlineStatusHtml(offlineStatus)}<div data-reader-offline-package><p class="bq-reader-note">Checking managed offline storage…</p></div><div class="bq-reader-source"><b>${escapeHtml(chapter.translation.source)}</b><span>${escapeHtml(chapter.translation.license)}</span><span>${escapeHtml(chapter.translation.attribution)}</span></div>${externalControl}</details><div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-reader-prev>← Previous</button><button type="button" class="bq-secondary-button" data-reader-next>Next →</button></div><p class="bq-form-message" data-reader-message aria-live="polite"></p></aside></div>${readerAudioHtml(audio, state, licensed)}<dialog class="bq-verse-dialog" data-verse-dialog aria-labelledby="bq-verse-peek-title"><div data-verse-dialog-body></div><button type="button" class="bq-secondary-button" data-verse-close>Close</button></dialog><dialog class="bq-context-dialog" data-context-dialog aria-label="Hebrew and Greek Context Lab"></dialog>`;
        host.querySelector('.bq-reader-passage')?.insertAdjacentHTML('afterbegin', '<h1 class="bq-reader-app-title">Bible Reader</h1>');
        const managedOffline = host.querySelector('[data-reader-offline-package]');
        if (managedOffline) host.querySelector('.bq-reader-settings')?.after(managedOffline);
        void renderOfflinePackageControls();
        void refreshAudioPackage();
        void applyFurigana(chapter,japanese);
        refreshAudioPresentation();
        refreshSpeechPresentation();
        if (highlightVerse && !licensed) queueMicrotask(() => host.querySelector(`[data-verse="${highlightVerse}"]`)?.scrollIntoView({ block: 'center' }));
      };
      const applyFurigana = async (chapter,japanese,{retrying=false}={}) => {
        const pass=++furiganaPass;
        if(!japanese||!furigana||chapter.translation.mode==='licensed-link') return;
        const status=host.querySelector('[data-reader-furigana-status]');
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
          const peek = presentReaderVersePeek(await reader.peek(verse)), japanese = reader.getState().translation === 'jko', vocabularyState = vocabulary?.getState();
          const vocabularyHtml = japanese && vocabulary && vocabularyState?.enabled ? japaneseVocabularyBlock({notes:vocabulary.notesFor(peek.text)}) : '';
          dialog.dataset.peekVerse = String(peek.verse);
          const audioAction = audio?.isAvailable?.() && audio?.hasVerseAlignment?.(reader.getState().book, reader.getState().chapter) && reader.getState().translation === 'bsb' ? `<button type="button" class="bq-secondary-button" data-reader-audio-verse="${peek.verse}">Play from verse ${peek.verse}</button>` : '';
          body.innerHTML = `<p class="bq-eyebrow">VERSE PEEK</p><h2 id="bq-verse-peek-title">${escapeHtml(peek.reference)}</h2><p class="bq-peek-text">${escapeHtml(peek.text)}</p>${audioAction}${vocabularyHtml}<button type="button" class="bq-secondary-button bq-peek-context-button" data-peek-context>אΩ Hebrew / Greek context</button><div class="bq-external-links">${peek.links.map(link => `<a ${externalAttrs} href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>`;
          if (!dialog.open) dialog.showModal();
        } catch (error) { message(error?.message || 'Could not open verse.'); }
      };
      const onChange = async event => {
        const target = event.target;
        searchResults = null;
        highlightVerse = null;
        try {
          if (target.matches('[data-reader-audio-narrator]') && audio) {
            if (!await audio.selectNarrator(target.value)) throw new Error('That audio narrator is unavailable for this chapter right now.');
            void refreshAudioPackage();
            return;
          }
          if (target.matches('[data-reader-audio-position]') && audio) { audio.seek(Number(target.value)); refreshAudioPresentation(); return; }
          if (target.matches('[data-reader-audio-follow]') && audio) { audioFollowVerse = target.checked; lastAudioFollowKey = null; refreshAudioPresentation(); return; }
          if (target.matches('[data-reader-audio-speed]') && audio) { audio.setPlaybackRate(Number(target.value)); return; }
          if (target.matches('[data-reader-audio-auto-next]') && audio) { audio.setAutoNext(target.checked); return; }
          if (target.matches('[data-reader-audio-timer]') && audio) { audio.setSleepTimer(Number(target.value) || null); return; }
          if (target.matches('[data-reader-speech-rate]') && speech) { speech.setPlaybackRate(Number(target.value)); return; }
          if (target.matches('[data-reader-furigana]') && furigana) { furigana.setMode(target.value); if (currentChapter) renderChapter(currentChapter, await getOfflineStatus()); return; }
          if (target.matches('[data-reader-translation]')) { audio?.pause(); speech?.stop(); reader.setTranslation(target.value); }
          else if (target.matches('[data-reader-book]')) { audio?.pause(); speech?.stop(); reader.setBook(target.value, 1); }
          else if (target.matches('[data-reader-chapter]')) { audio?.pause(); speech?.stop(); reader.setChapter(Number(target.value)); }
          else return;
          await load();
        } catch (error) { message(error?.message || 'Could not change passage.'); }
      };
      const onClick = async event => {
        const target = event.target instanceof Element ? event.target : null; if (!target) return;
        if (target.closest('[data-reader-retry]')) return load();
        if (target.closest('[data-reader-prev], [data-reader-next], [data-search-result], [data-reader-quest-return], [data-reader-quest-complete]')) speech?.stop?.();
        if (target.closest('[data-reader-speech-toggle]') && speech?.isAvailable?.()) {
          try {
            if (speech.getState().status === 'speaking') speech.pause();
            else speech.play();
            refreshSpeechPresentation();
          } catch (error) { message(error?.message || 'Browser speech could not start.'); }
          return;
        }
        if (target.closest('[data-reader-speech-stop]') && speech?.isAvailable?.()) {
          speech.stop();
          refreshSpeechPresentation();
          return;
        }
        if (target.closest('[data-reader-audio-download]') && audio?.installChapter) {
          const state = reader.getState(), key = `${state.book}:${state.chapter}`, container = host.querySelector('[data-reader-audio-package]');
          if (activeAudioDownload) return;
          activeAudioDownload = { key, book: state.book, chapter: state.chapter };
          activeAudioProgress = null;
          if (container) container.innerHTML = '<span>Starting verified audio download…</span><progress data-reader-audio-progress max="100"></progress><span data-reader-audio-progress-text></span><button type="button" class="bq-secondary-button" data-reader-audio-cancel>Cancel download</button>';
          try {
            const result = await audio.installChapter(state.book, state.chapter, progress => {
              activeAudioProgress = progress;
              const current = host.querySelector('[data-reader-audio-progress]'), text = host.querySelector('[data-reader-audio-progress-text]');
              if (current) current.value = Math.round(progress.ratio * 100);
              if (text) text.textContent = `${progress.phase} · ${formatBytes(progress.receivedBytes)} / ${formatBytes(progress.totalBytes)}`;
            });
            unavailableAudioDownloads.delete(audioDownloadKey(state));
            message(result.status === 'current' ? 'Audio chapter is already current.' : 'Audio chapter downloaded and verified.');
          } catch (error) {
            if (error?.code === 'audio-download-unavailable') unavailableAudioDownloads.add(audioDownloadKey(state));
            message(error?.name === 'AbortError' ? 'Audio download cancelled.' : error?.message || 'Audio download failed.');
          } finally {
            if (activeAudioDownload?.key === key) activeAudioDownload = null;
            activeAudioProgress = null;
            await refreshAudioPackage();
          }
          return;
        }
        if (target.closest('[data-reader-audio-cancel]') && audio?.cancelChapter) {
          const button = target.closest('[data-reader-audio-cancel]'), state = reader.getState();
          audio.cancelChapter(button.dataset.book || activeAudioDownload?.book || state.book, Number(button.dataset.chapter || activeAudioDownload?.chapter || state.chapter)); return;
        }
        if (target.closest('[data-reader-audio-remove]') && audio?.removeChapter) {
          const state = reader.getState();
          try { await audio.removeChapter(state.book, state.chapter); message('Offline audio chapter removed.'); await refreshAudioPackage(); }
          catch (error) { message(error?.message || 'Could not remove offline audio.'); }
          return;
        }
        if (target.closest('[data-reader-audio-toggle]') && audio) {
          const state = reader.getState(), playback = audio.getState()?.playback;
          try {
            if (playback?.status === 'playing') audio.pause();
            else {
              if (playback?.status === 'error' || playback?.translationId !== state.translation || playback?.bookCode !== state.book || playback?.chapter !== state.chapter) await audio.load(state.translation, state.book, state.chapter);
              await audio.play();
            }
            refreshAudioPresentation();
          } catch (error) { message(error?.message || 'Audio playback failed.'); }
          return;
        }
        const audioVerse = target.closest('[data-reader-audio-verse]');
        if (audioVerse && audio) {
          const state = reader.getState(), verse = Number(audioVerse.dataset.readerAudioVerse), playback = audio.getState()?.playback;
          try {
            if (state.translation !== 'bsb') throw new Error('Audio is available only for the BSB translation.');
            if (playback?.translationId !== state.translation || playback?.bookCode !== state.book || playback?.chapter !== state.chapter) await audio.load(state.translation, state.book, state.chapter);
            audio.seekVerse(verse);
            await audio.play();
            host.querySelector('[data-verse-dialog]')?.close();
            refreshAudioPresentation();
          } catch (error) { message(error?.message || 'Could not seek to the selected verse.'); }
          return;
        }
        if (target.closest('[data-reader-use-bsb]')) { speech?.stop?.(); reader.setTranslation('bsb'); searchResults = null; highlightVerse = null; return load('Loading BSB…'); }
        if (target.closest('[data-reader-furigana-retry]') && currentChapter && reader.getState().translation === 'jko') { await applyFurigana(currentChapter, true, { retrying: true }); return; }
        if (target.closest('[data-reader-offline-download]') && offlinePackages) {
          if (activeOfflineTranslation) { message('Wait for the full translation download to finish or cancel it first.'); return; }
          const state = reader.getState(), key = `${state.translation}:${state.book}`;
          activeOfflineDownload = { translationId: state.translation, bookCode: state.book };
          await renderOfflinePackageControls();
          let outcome = '';
          try {
            const result = await offlinePackages.install(state.translation, state.book, updateOfflineProgress);
            offlineInventory = null;
            outcome = result.status === 'current' ? 'Offline book is already current.' : 'Offline book downloaded and verified.';
          } catch (error) {
            outcome = error?.name === 'AbortError' ? 'Offline download cancelled.' : (error?.message || 'Offline download failed. Retry when connected.');
          } finally {
            if (activeOfflineDownload && `${activeOfflineDownload.translationId}:${activeOfflineDownload.bookCode}` === key) activeOfflineDownload = null;
            const latest = reader.getState();
            if (currentChapter && `${latest.translation}:${latest.book}` === key) {
              renderChapter(currentChapter, await getOfflineStatus());
              queueMicrotask(() => message(outcome));
            } else {
              await renderOfflinePackageControls();
              message(outcome);
            }
          }
          return;
        }
        if (target.closest('[data-reader-translation-download]') && offlinePackages?.installTranslation) {
          if (activeOfflineDownload) { message('Wait for the current book download to finish or cancel it first.'); return; }
          const translationId = reader.getState().translation;
          activeOfflineTranslation = { translationId };
          await renderOfflinePackageControls();
          let outcome = '';
          try {
            const result = await offlinePackages.installTranslation(translationId, updateOfflineTranslationProgress);
            offlineInventory = null;
            outcome = `Full ${translationId.toUpperCase()} translation is downloaded and verified (${result.installedBooks} books).`;
          } catch (error) {
            outcome = error?.name === 'AbortError' ? 'Full translation download cancelled. Downloaded books are kept; you can resume later.' : (error?.message || 'Full translation download failed. Retry when connected.');
          } finally {
            if (activeOfflineTranslation?.translationId === translationId) activeOfflineTranslation = null;
            await renderOfflinePackageControls();
            message(outcome);
          }
          return;
        }
        if (target.closest('[data-reader-translation-cancel]') && offlinePackages && activeOfflineTranslation) {
          offlinePackages.cancelTranslation(activeOfflineTranslation.translationId);
          message('Cancelling full translation download…');
          return;
        }
        if (target.closest('[data-reader-translation-remove]') && offlinePackages?.removeTranslation) {
          const translationId = reader.getState().translation;
          try {
            await offlinePackages.removeTranslation(translationId);
            offlineInventory = null;
            await renderOfflinePackageControls();
            message(`Removed full ${translationId.toUpperCase()} translation from offline storage.`);
          } catch (error) { message(error?.message || 'Could not remove the offline translation.'); }
          return;
        }
        if (target.closest('[data-reader-offline-cancel]') && offlinePackages && activeOfflineDownload) {
          offlinePackages.cancel(activeOfflineDownload.translationId, activeOfflineDownload.bookCode);
          message('Cancelling offline download…');
          return;
        }
        if (target.closest('[data-reader-offline-remove]') && offlinePackages) {
          const state = reader.getState(), key = `${state.translation}:${state.book}`;
          try {
            await offlinePackages.remove(state.translation, state.book);
            if (offlineInventory) offlineInventory = offlineInventory.filter(item => !(item.translationId === state.translation && item.bookCode === state.book));
            const latest = reader.getState();
            if (currentChapter && `${latest.translation}:${latest.book}` === key) renderChapter(currentChapter, await getOfflineStatus());
            queueMicrotask(() => message('Managed offline book removed. You can download it again at any time.'));
          } catch (error) {
            message(error?.message || 'Could not remove the offline book.');
          }
          return;
        }
        const removePackage = target.closest('[data-reader-offline-remove-package]');
        if (removePackage && offlinePackages) {
          const translationId = String(removePackage.dataset.translation || ''), bookCode = String(removePackage.dataset.book || '');
          try {
            await offlinePackages.remove(translationId, bookCode);
            if (offlineInventory) offlineInventory = offlineInventory.filter(item => !(item.translationId === translationId && item.bookCode === bookCode));
            await renderOfflinePackageControls();
            message(`Removed ${translationId.toUpperCase()} ${bookCode} from offline storage.`);
          } catch (error) { message(error?.message || 'Could not remove the offline book.'); }
          return;
        }
        if (target.closest('[data-reader-prev]')) { audio?.pause(); searchResults = null; highlightVerse = null; reader.move(-1); return load(); }
        if (target.closest('[data-reader-next]')) { audio?.pause(); searchResults = null; highlightVerse = null; reader.move(1); return load(); }
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
        const resultButton = target.closest('[data-search-result]'); if (resultButton && searchResults) { audio?.pause(); const result = searchResults.results[Number(resultButton.dataset.searchResult)]; operation++; try { renderLoading('Opening search result…'); const opened = await reader.openSearchResult(result); highlightVerse = opened.verse; searchResults = null; renderChapter(opened.chapter, await getOfflineStatus()); } catch (error) { renderError(error, await getOfflineStatus()); } }
      };
      const onSubmit = async event => {
        const form = event.target instanceof HTMLFormElement ? event.target : null;
        if (!form?.matches('[data-reader-search]')) return;
        event.preventDefault();
        const id = ++operation;
        const query = String(new FormData(form).get('query') || '').trim();
        const button = form.querySelector('button[type="submit"]');
        const offline = globalThis.navigator?.onLine === false;
        button.disabled = true;
        button.textContent = offline ? 'Searching downloads…' : 'Searching…';
        message(offline ? 'Searching downloaded Bible books…' : 'Searching Scripture source…');
        try {
          const results = offline && typeof offlinePackages?.searchOfflineText === 'function'
            ? await offlinePackages.searchOfflineText(reader.getState().translation, query, 30)
            : await reader.search(query, { limit: 30 });
          if (id !== operation) return;
          const chapter = await reader.load();
          if (id !== operation) return;
          const offlineStatus = await getOfflineStatus();
          if (id !== operation) return;
          searchResults = results;
          renderChapter(chapter, offlineStatus);
          if (id !== operation) return;
          host.querySelector('.bq-search-results')?.scrollIntoView({ block: 'start' });
        } catch (error) {
          if (id !== operation) return;
          message(error?.message || 'Search failed.');
          button.disabled = false;
          button.textContent = 'Search';
        }
      };
      const unsubscribeAudio = audio?.subscribe?.(refreshAudioPresentation);
      const unsubscribeSpeech = speech?.subscribe?.(refreshSpeechPresentation);
      host.addEventListener('change', onChange); host.addEventListener('click', onClick); host.addEventListener('submit', onSubmit); load();
      return () => { operation++; furiganaPass++; unsubscribeAudio?.(); unsubscribeSpeech?.(); speech?.dispose?.(); if (activeOfflineDownload && offlinePackages) offlinePackages.cancel(activeOfflineDownload.translationId, activeOfflineDownload.bookCode); if (activeOfflineTranslation && offlinePackages) offlinePackages.cancelTranslation(activeOfflineTranslation.translationId); activeOfflineDownload = null; activeOfflineTranslation = null; host.querySelector('[data-verse-dialog]')?.close(); host.querySelector('[data-context-dialog]')?.close(); host.removeEventListener('change', onChange); host.removeEventListener('click', onClick); host.removeEventListener('submit', onSubmit); };
    }
  };
}

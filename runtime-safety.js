(() => {
  const nativeFetch = window.fetch.bind(window);
  const BOOK_NAMES = {
    ROM: 'Romans', ACT: 'Acts', HEB: 'Hebrews', JAS: 'James',
    '1CO': '1 Corinthians', '1TI': '1 Timothy', '1PE': '1 Peter', REV: 'Revelation'
  };

  const questionPackCode = (input) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const match = url.match(/(?:^|\/)data\/packs\/questions\/([A-Z0-9]+)\.json(?:[?#].*)?$/i);
    return match ? match[1].toUpperCase() : null;
  };

  const withContext = (item) => {
    const { bookName: _bookName, ...clean } = item;
    const safety = clean.safety || {};
    if (safety.action !== 'context') return clean;
    const topic = safety.topics?.[0];
    const note = topic && window.BQ_DOCTRINAL_CONTEXT?.[topic];
    if (!note) return clean;
    const answer = String(clean.a || '').trim();
    return {
      ...clean,
      a: `${answer}${answer ? '\n\n' : ''}Context note: ${note}`,
      safety: { ...safety, contextApplied: true }
    };
  };

  window.fetch = async function bibleQuestSafeFetch(input, init) {
    const code = questionPackCode(input);
    const response = await nativeFetch(input, init);
    if (!code) return response;

    // Fail closed. A stale/raw imported pack must never bypass the safety policy.
    const policy = window.BQ_DOCTRINAL_SAFETY;
    if (!policy || typeof policy.filterDeck !== 'function') {
      console.error('BibleQuest doctrinal safety policy unavailable; blocking imported question pack.');
      return new Response('[]', {
        status: 200,
        statusText: 'BibleQuest safety policy unavailable',
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (!response.ok) return response;
    try {
      const rows = await response.clone().json();
      if (!Array.isArray(rows)) return response;
      const bookName = BOOK_NAMES[code] || '';
      const prepared = rows.map(item => bookName ? { ...item, bookName } : item);
      const result = policy.filterDeck(prepared);
      const safeRows = result.allowed.map(withContext);
      if (result.quarantined.length) {
        console.info(`BibleQuest safety: quarantined ${result.quarantined.length} imported question(s) from normal play.`);
      }
      return new Response(JSON.stringify(safeRows), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('BibleQuest safety could not validate imported question pack; blocking it.', error);
      return new Response('[]', {
        status: 200,
        statusText: 'BibleQuest question validation failed',
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  };
})();
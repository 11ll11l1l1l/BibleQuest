(() => {
  const nativeFetch = window.fetch.bind(window);
  const isQuestionPack = (input) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    return /(?:^|\/)data\/packs\/questions\/[A-Z0-9]+\.json(?:[?#].*)?$/i.test(url);
  };

  const withContext = (item) => {
    const safety = item.safety || {};
    if (safety.action !== 'context') return item;
    const topic = safety.topics?.[0];
    const note = topic && window.BQ_DOCTRINAL_CONTEXT?.[topic];
    if (!note) return item;
    const answer = String(item.a || '').trim();
    return {
      ...item,
      a: `${answer}${answer ? '\n\n' : ''}Context note: ${note}`,
      safety: { ...safety, contextApplied: true }
    };
  };

  window.fetch = async function bibleQuestSafeFetch(input, init) {
    const response = await nativeFetch(input, init);
    if (!isQuestionPack(input)) return response;

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
      const result = policy.filterDeck(rows);
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

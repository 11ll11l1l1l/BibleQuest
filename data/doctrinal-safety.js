(() => {
  const TOPICS = [
    ['salvation', /\b(salvation|saved|justify|justified|justification|righteousness|works of the law|eternal life|condemnation|grace|faith)\b/i],
    ['baptism', /\b(bapti[sz](?:e|ed|ing|m)|water baptism)\b/i],
    ['holy-spirit', /\b(Holy Spirit|Spirit baptism|filled with the Spirit|tongues|speaking in tongues|spiritual gifts?)\b/i],
    ['healing', /\b(heal(?:ed|ing)?|divine healing|sick(?:ness)?|anoint(?:ed|ing)?)\b/i],
    ['communion', /\b(Lord(?:'s|’s) Supper|communion|Eucharist|bread and cup|body and blood)\b/i],
    ['sanctification', /\b(sanctif(?:y|ied|ication)|holiness|holy life)\b/i],
    ['election', /\b(predestin(?:ed|ation)|elect(?:ion|ed)?|chosen before|foreknow)\b/i],
    ['security', /\b(eternal security|lose salvation|fall away|apostasy|once saved)\b/i],
    ['end-times', /\b(rapture|tribulation|millennium|second coming|return of Christ|antichrist|mark of the beast|end times|last days)\b/i],
    ['church-office', /\b(elder|pastor|bishop|deacon|women.*teach|women.*pastor|church authority)\b/i],
    ['marriage-sexuality', /\b(marriage|divorce|remarry|adultery|sexual immorality|homosexual|same-sex|husband|wife)\b/i],
    ['creation', /\b(six days|creation days|age of the earth|young earth|old earth)\b/i],
    ['spiritual-warfare', /\b(demon|demons|deliverance|spiritual warfare|possess(?:ed|ion))\b/i],
    ['giving', /\b(tith(?:e|es|ing)|prosperity|seed faith|financial blessing)\b/i]
  ];

  const HIGH_RISK_PATTERNS = [
    /\bwho is justified before God\b/i,
    /\bwhat (?:must|should) (?:a person|someone|people|we) do (?:to|in order to) (?:be saved|receive eternal life|be justified|have sins forgiven)\b/i,
    /\bhow (?:is|are) .* saved\b/i,
    /\bwhat role do .* works .* justification\b/i,
    /\bwhat do .* receive .* eternal life\b/i,
    /\bforgiveness of (?:their|your|our) sins\b/i,
    /\bwhat is required .* salvation\b/i,
    /\bwhat evidence .* Holy Spirit\b/i,
    /\bmust .* speak .* tongues\b/i,
    /\bwill God heal\b/i,
    /\bguarantee(?:d)? healing\b/i,
    /\bwhen will .* rapture\b/i,
    /\bwho can be .* pastor\b/i
  ];

  const TEXTUAL_CUES = [
    /\baccording to\b/i,
    /\bwhat did (?:Jesus|Paul|Peter|John|Moses|David|the apostles?|the angel|God|the Lord)\b/i,
    /\bwhat does (?:Paul|Peter|John|Jesus|the passage|the verse|the text) say\b/i,
    /\bwhat happened\b/i,
    /\bwho\b/i,
    /\bwhere\b/i,
    /\bwhen\b/i,
    /\bwhich\b/i,
    /\bhow many\b/i
  ];

  const CONTEXT_REQUIRED_REFS = [
    /^Romans\s+2:/i,
    /^Romans\s+9:/i,
    /^Romans\s+11:/i,
    /^Acts\s+2:38/i,
    /^Acts\s+8:/i,
    /^Acts\s+10:/i,
    /^Acts\s+19:/i,
    /^Hebrews\s+6:/i,
    /^Hebrews\s+10:/i,
    /^James\s+2:/i,
    /^1 Corinthians\s+11:/i,
    /^1 Corinthians\s+12:/i,
    /^1 Corinthians\s+14:/i,
    /^1 Timothy\s+2:/i,
    /^1 Peter\s+3:21/i,
    /^Revelation\s+20:/i
  ];

  function normalize(item = {}) {
    const rawRef = String(item.r || item.ref || item.reference || '');
    const bookName = String(item.bookName || '').trim();
    const fullRef = bookName && rawRef && !rawRef.toLowerCase().startsWith(bookName.toLowerCase()) ? `${bookName} ${rawRef}` : rawRef;
    return {
      q: String(item.q || item.question || ''),
      a: String(item.a || item.answer || item.why || ''),
      r: fullRef,
      source: String(item.source || '')
    };
  }

  function classify(item = {}) {
    const n = normalize(item);
    const combined = `${n.q} ${n.a}`;
    const topics = TOPICS.filter(([, rx]) => rx.test(combined)).map(([name]) => name);
    const highRisk = HIGH_RISK_PATTERNS.some(rx => rx.test(n.q));
    const contextRef = CONTEXT_REQUIRED_REFS.some(rx => rx.test(n.r));
    const textual = TEXTUAL_CUES.some(rx => rx.test(n.q));

    if (highRisk) {
      return { action: 'quarantine', classification: 'INTERPRETIVE_OR_DOCTRINAL', topics, reason: 'Question can be read as a universal doctrine claim without sufficient context.' };
    }

    if (topics.length && !textual) {
      return { action: 'quarantine', classification: 'INTERPRETIVE_OR_DOCTRINAL', topics, reason: 'Sensitive doctrine topic is phrased as interpretation rather than direct textual recall.' };
    }

    if (topics.length || contextRef) {
      return { action: 'context', classification: 'PASSAGE_CONTEXT', topics, reason: 'Keep only with explicit passage framing and a context notice.' };
    }

    return { action: 'allow', classification: 'TEXTUAL_FACT', topics: [], reason: 'Direct factual or textual recall.' };
  }

  function filterDeck(items = []) {
    const allowed = [];
    const quarantined = [];
    for (const item of items) {
      const safety = classify(item);
      const tagged = { ...item, safety };
      if (safety.action === 'quarantine') quarantined.push(tagged);
      else allowed.push(tagged);
    }
    return { allowed, quarantined };
  }

  window.BQ_DOCTRINAL_SAFETY = {
    version: 1,
    authority: 'Scripture first; CAMACOP statement of faith for doctrinal alignment; secondary study resources are not doctrinal authorities.',
    classify,
    filterDeck
  };
})();
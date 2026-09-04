(() => {
  // Topic detection should identify genuinely sensitive teaching areas, not ordinary words
  // that happen to occur in biblical narrative or poetry.
  const TOPICS = [
    ['salvation', /\b(justif(?:y|ied|ication)|works of the law|eternal life|redemption|forgiveness of sins?|saved from (?:sin|wrath|condemnation))\b/i],
    ['baptism', /\b(bapti[sz](?:e|ed|ing|m)|water baptism)\b/i],
    ['holy-spirit', /\b(Holy Spirit|Spirit baptism|bapti[sz](?:ed|m) (?:with|in) the (?:Holy )?Spirit|filled with the (?:Holy )?Spirit|speaking in tongues|spiritual gifts?)\b/i],
    ['healing', /\b(divine healing|heal(?:ed|ing)|miraculous healing)\b/i],
    ['communion', /\b(Lord(?:'s|’s) Supper|communion|Eucharist|bread and cup|body and blood)\b/i],
    ['sanctification', /\b(sanctif(?:y|ied|ication)|holy life)\b/i],
    ['election', /\b(predestin(?:ed|ation)|elect(?:ion|ed)?|chosen before|foreknow)\b/i],
    ['security', /\b(eternal security|lose salvation|fall away|apostasy|once saved)\b/i],
    ['end-times', /\b(rapture|millennium|second coming|return of Christ|antichrist|mark of the beast|end times|last days)\b/i],
    ['church-office', /\b(elder|pastor|bishop|deacon|women.*teach|women.*pastor|women.*elder|church authority)\b/i],
    ['marriage-sexuality', /\b(marriage|divorce|remarry|adultery|sexual immorality|homosexual|same-sex)\b/i],
    ['creation', /\b(six days|creation days|age of the earth|young earth|old earth)\b/i],
    ['spiritual-warfare', /\b(demon|demons|demonic|spiritual warfare|possess(?:ed|ion))\b/i],
    ['giving', /\b(tith(?:e|es|ing)|prosperity gospel|seed faith|financial blessing)\b/i]
  ];

  // These are formulations that can turn one verse into a universal or disputed doctrine.
  // They stay out of scored play until rewritten or pastor-reviewed, even when a reference exists.
  const HIGH_RISK_PATTERNS = [
    /\bwho is justified before God\b/i,
    /\bhow (?:is|are) (?:a person|someone|one|people|we|believers?|Christians?) (?:saved|justified)\b/i,
    /\bwhat (?:must|should) (?:a person|someone|people|we|believers?|Christians?) do (?:to|in order to) (?:be saved|receive eternal life|be justified|have sins forgiven)\b/i,
    /\bwhat role do .* works .* justification\b/i,
    /\bwhat is required .* salvation\b/i,
    /\bis bapti[sz]m (?:necessary|required|essential) (?:for|to) (?:salvation|be saved)\b/i,
    /\bmust .* be bapti[sz]ed .* (?:saved|salvation)\b/i,
    /\bwhat evidence .* Holy Spirit\b/i,
    /\bis speaking in tongues .* (?:evidence|required|necessary)\b/i,
    /\bmust .* speak .* tongues\b/i,
    /\bdoes God always heal\b/i,
    /\bis (?:divine )?healing guaranteed\b/i,
    /\b(?:enough|more) faith .* guarantee .* heal/i,
    /\bcan (?:a )?(?:believer|Christian|person) lose (?:his|her|their)?\s*salvation\b/i,
    /\bonce saved.*always saved\b/i,
    /\bwhen will .* rapture\b/i,
    /\b(?:pre|mid|post)[- ]?tribulation rapture\b/i,
    /\bwho can be .* pastor\b/i,
    /\bcan women (?:be|serve as) (?:pastors?|elders?|bishops?)\b/i,
    /\bis (?:same-sex|homosexual) marriage .* (?:biblical|permitted|sin)\b/i,
    /\bmust Christians? tithe\b/i,
    /\bis tithing required\b/i,
    /\bdoes giving .* guarantee .* (?:wealth|prosperity|blessing)\b/i,
    /\bhow old is the earth according to (?:the Bible|Scripture)\b/i
  ];

  const CONTEXT_REQUIRED_REFS = [
    /^Romans\s+2:/i,
    /^Romans\s+9:/i,
    /^Romans\s+11:/i,
    /^Acts\s+2:38/i,
    /^Acts\s+8:/i,
    /^Acts\s+10:/i,
    /^Acts\s+15:/i,
    /^Acts\s+16:(?:30(?:-31)?|31)/i,
    /^Acts\s+19:/i,
    /^Acts\s+22:16/i,
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

    if (highRisk) {
      return { action: 'quarantine', classification: 'INTERPRETIVE_OR_DOCTRINAL', topics, reason: 'Question can be read as a universal or disputed doctrine claim without sufficient context.' };
    }

    // A sensitive topic tied to an explicit passage remains useful learning material, but it
    // receives context rather than being treated as a complete doctrinal statement by itself.
    if (topics.length || contextRef) {
      return { action: 'context', classification: 'PASSAGE_CONTEXT', topics, reason: 'Keep with explicit passage framing and a context notice.' };
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
    version: 2,
    authority: 'Scripture first; CAMACOP statement of faith for doctrinal alignment; secondary study resources are not doctrinal authorities.',
    classify,
    filterDeck
  };
})();
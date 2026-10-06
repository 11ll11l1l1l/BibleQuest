const SUPPORTED_DISCOVERY_LOCALES = Object.freeze(['en', 'tl', 'ceb', 'ilo']);
const DISCOVERY_KINDS = Object.freeze(['emotion', 'need']);
const TOKEN_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

const freezeLabels = labels => Object.freeze(Object.fromEntries(SUPPORTED_DISCOVERY_LOCALES.map(locale => [locale, String(labels[locale] || labels.en || '').trim()])));
const entry = (kind, id, labels, aliases, scripture, adjacent = []) => Object.freeze({
  kind,
  id,
  labels: freezeLabels(labels),
  aliases: Object.freeze([...new Set([id, ...(aliases || [])].map(normalizeDiscoveryText).filter(Boolean))]),
  scripture: Object.freeze([...(scripture || [])]),
  adjacent: Object.freeze([...adjacent]),
});

export function normalizeDiscoveryText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export const LIBRARY_DISCOVERY_SHELL = Object.freeze({
  feelingQuestion: freezeLabels({ en: 'How are you feeling?', tl: 'Ano ang nararamdaman mo?', ceb: 'Unsa imong gibati?', ilo: 'Ania ti mariknam?' }),
  needQuestion: freezeLabels({ en: 'What do you need right now?', tl: 'Ano ang kailangan mo ngayon?', ceb: 'Unsa imong gikinahanglan karon?', ilo: 'Ania ti kasapulam ita?' }),
  selected: freezeLabels({ en: 'Selected', tl: 'Napili', ceb: 'Napili', ilo: 'Napili' }),
  suggestions: freezeLabels({ en: 'You could also try', tl: 'Maaari mo ring subukan', ceb: 'Mahimo usab nimong sulayan', ilo: 'Mabalinmo met a padasen' }),
  scripture: freezeLabels({ en: 'BSB Scripture to read', tl: 'Kasulatan sa BSB na maaaring basahin', ceb: 'Kasulatan sa BSB nga mabasa', ilo: 'Kasuratan iti BSB a mabasa' }),
  noResults: freezeLabels({ en: 'No published devotionals match all of these selections yet.', tl: 'Wala pang na-publish na debosyonal na tumutugma sa lahat ng napili.', ceb: 'Wala pay gipatik nga debosyonal nga motakdo sa tanan nimong gipili.', ilo: 'Awan pay naipablaak a debosional a maitunos kadagiti amin a pinilim.' }),
});

export const LIBRARY_EMOTIONS = Object.freeze([
  entry('emotion', 'anxious', { en: 'Anxious / worried', tl: 'Balisa / nag-aalala', ceb: 'Nabalaka / nahingawa', ilo: 'Madanagan / mariribukan' }, ['worried', 'worry', 'nervous', 'uneasy'], ['Philippians 4:6-7', '1 Peter 5:7'], ['afraid', 'overwhelmed', 'peaceful']),
  entry('emotion', 'afraid', { en: 'Afraid', tl: 'Natatakot', ceb: 'Nahadlok', ilo: 'Mabuteng' }, ['fearful', 'scared', 'fear'], ['Psalm 34:4', 'Isaiah 41:10'], ['anxious', 'insecure', 'hopeful']),
  entry('emotion', 'sad', { en: 'Sad', tl: 'Malungkot', ceb: 'Masulob-on', ilo: 'Naliday' }, ['down', 'blue', 'unhappy'], ['Psalm 34:18', 'Matthew 5:4'], ['grieving', 'lonely', 'discouraged']),
  entry('emotion', 'grieving', { en: 'Grieving / loss', tl: 'Nagdadalamhati / may pagkawala', ceb: 'Nagsubo / adunay nawala', ilo: 'Agladladingit / adda napukaw' }, ['grief', 'loss', 'bereaved', 'heartbroken', 'mourning'], ['Psalm 147:3', 'Revelation 21:4'], ['sad', 'lonely', 'hurt']),
  entry('emotion', 'lonely', { en: 'Lonely', tl: 'Nag-iisa', ceb: 'Nag-inusara', ilo: 'Agmaymaysa' }, ['alone', 'isolated', 'left out'], ['Psalm 68:6', 'Hebrews 13:5'], ['rejected', 'sad', 'connected']),
  entry('emotion', 'angry', { en: 'Angry', tl: 'Galit', ceb: 'Nasuko', ilo: 'Nakarrungsot' }, ['mad', 'furious', 'rage'], ['James 1:19-20', 'Ephesians 4:26'], ['frustrated', 'hurt', 'impatient']),
  entry('emotion', 'hurt', { en: 'Hurt / betrayed', tl: 'Nasaktan / pinagtaksilan', ceb: 'Nasakitan / gibudhian', ilo: 'Nasaktan / naliputan' }, ['betrayed', 'wounded', 'offended'], ['Psalm 55:12-14', 'Psalm 147:3'], ['angry', 'grieving', 'rejected']),
  entry('emotion', 'rejected', { en: 'Rejected / unwanted', tl: 'Hindi tanggap / hindi gusto', ceb: 'Gisalikway / dili gusto', ilo: 'Tinukiad / saan a kayat' }, ['unwanted', 'excluded', 'abandoned'], ['Psalm 27:10', '1 Peter 2:4'], ['lonely', 'hurt', 'insecure']),
  entry('emotion', 'guilty', { en: 'Guilty', tl: 'Nakokonsensiya', ceb: 'Nakonsensya', ilo: 'Makonsiensia' }, ['guilt', 'regretful', 'remorse'], ['1 John 1:9', 'Romans 8:1'], ['ashamed', 'tempted', 'hopeful']),
  entry('emotion', 'ashamed', { en: 'Ashamed', tl: 'Nahihiya', ceb: 'Naulaw', ilo: 'Mabain' }, ['shame', 'embarrassed', 'disgraced'], ['Romans 10:11', 'Hebrews 12:2'], ['guilty', 'insecure', 'rejected']),
  entry('emotion', 'insecure', { en: 'Insecure / unworthy', tl: 'Walang tiwala sa sarili / hindi karapat-dapat', ceb: 'Walay pagsalig sa kaugalingon / dili takos', ilo: 'Awan ti panagtalek iti bagi / saan a maikari' }, ['unworthy', 'not enough', 'inadequate', 'insecure'], ['Ephesians 2:10', '1 Peter 2:9'], ['ashamed', 'rejected', 'doubtful']),
  entry('emotion', 'doubtful', { en: 'Doubtful', tl: 'Nagdududa', ceb: 'Nagduhaduha', ilo: 'Agduadua' }, ['doubt', 'skeptical', 'questioning'], ['Mark 9:24', 'James 1:5-6'], ['confused', 'insecure', 'hopeful']),
  entry('emotion', 'confused', { en: 'Confused / uncertain', tl: 'Nalilito / hindi sigurado', ceb: 'Nalibog / dili sigurado', ilo: 'Nariro / saan a sigurado' }, ['uncertain', 'unsure', 'lost', 'confusion'], ['James 1:5', 'Proverbs 3:5-6'], ['doubtful', 'overwhelmed', 'frustrated']),
  entry('emotion', 'discouraged', { en: 'Discouraged', tl: 'Pinanghihinaan ng loob', ceb: 'Nawad-an og kadasig', ilo: 'Nauppapay' }, ['disheartened', 'demotivated', 'defeated'], ['Joshua 1:9', 'Galatians 6:9'], ['hopeless', 'tired', 'frustrated']),
  entry('emotion', 'hopeless', { en: 'Hopeless', tl: 'Nawawalan ng pag-asa', ceb: 'Nawad-an og paglaom', ilo: 'Awan ti namnama' }, ['despair', 'desperate', 'no hope'], ['Romans 15:13', 'Lamentations 3:21-23'], ['discouraged', 'sad', 'hopeful']),
  entry('emotion', 'overwhelmed', { en: 'Overwhelmed', tl: 'Sobrang nabibigatan', ceb: 'Nabug-atan pag-ayo', ilo: 'Nadagsenan unay' }, ['burned out', 'burnt out', 'burnout', 'too much', 'swamped'], ['Psalm 61:2', 'Matthew 11:28'], ['stressed', 'tired', 'anxious']),
  entry('emotion', 'stressed', { en: 'Stressed', tl: 'Nai-stress', ceb: 'Na-stress', ilo: 'Na-stress' }, ['stress', 'pressured', 'tense'], ['Matthew 6:34', 'John 14:27'], ['anxious', 'overwhelmed', 'tired']),
  entry('emotion', 'tired', { en: 'Tired / weary', tl: 'Pagod / nanghihina', ceb: 'Kapoy / gikapoy', ilo: 'Nabannog / nakapuy' }, ['weary', 'exhausted', 'drained', 'worn out'], ['Matthew 11:28-30', 'Isaiah 40:31'], ['overwhelmed', 'stressed', 'discouraged']),
  entry('emotion', 'spiritually_dry', { en: 'Spiritually dry / distant', tl: 'Tuyong espirituwal / malayo', ceb: 'Uga sa espiritu / layo', ilo: 'Namagaan iti espiritu / adayo' }, ['spiritually dry', 'distant', 'far away', 'dry faith'], ['Psalm 42:1-2', 'James 4:8'], ['numb', 'doubtful', 'hopeful']),
  entry('emotion', 'tempted', { en: 'Tempted', tl: 'Natutukso', ceb: 'Gitintal', ilo: 'Masulisog' }, ['temptation', 'struggling with temptation'], ['1 Corinthians 10:13', 'James 1:12'], ['guilty', 'frustrated', 'doubtful']),
  entry('emotion', 'impatient', { en: 'Impatient / waiting', tl: 'Naiinip / naghihintay', ceb: 'Walay pasensya / naghulat', ilo: 'Di makaur-uray / agur-uray' }, ['waiting', 'impatient', 'delayed'], ['Psalm 27:14', 'Romans 12:12'], ['frustrated', 'anxious', 'discouraged']),
  entry('emotion', 'jealous', { en: 'Jealous / envious', tl: 'Nagseselos / naiinggit', ceb: 'Nagselos / nasina', ilo: 'Agimon / apal' }, ['envious', 'envy', 'jealousy'], ['Proverbs 14:30', 'James 3:16'], ['insecure', 'frustrated', 'angry']),
  entry('emotion', 'frustrated', { en: 'Frustrated', tl: 'Nadidismaya / nabibigo', ceb: 'Nadismaya', ilo: 'Napaay / nauppapay' }, ['frustration', 'stuck', 'fed up'], ['Galatians 6:9', 'Psalm 37:7'], ['angry', 'impatient', 'discouraged']),
  entry('emotion', 'numb', { en: 'Numb / empty', tl: 'Manhid / walang laman', ceb: 'Walay pagbati / haw-ang', ilo: 'Awan marikna / kawaw' }, ['empty', 'numb', 'hollow', 'nothing'], ['Psalm 42:5', 'Ezekiel 36:26'], ['spiritually_dry', 'sad', 'tired']),
  entry('emotion', 'joyful', { en: 'Joyful', tl: 'Masaya', ceb: 'Malipayon', ilo: 'Naragsak' }, ['happy', 'joy', 'rejoicing'], ['Philippians 4:4', 'Psalm 118:24'], ['grateful', 'excited', 'peaceful']),
  entry('emotion', 'grateful', { en: 'Grateful', tl: 'Nagpapasalamat', ceb: 'Mapasalamaton', ilo: 'Agyaman' }, ['thankful', 'gratitude', 'blessed'], ['1 Thessalonians 5:18', 'Psalm 100:4'], ['joyful', 'peaceful', 'connected']),
  entry('emotion', 'peaceful', { en: 'Peaceful / content', tl: 'Payapa / kuntento', ceb: 'Malinawon / kontento', ilo: 'Natalna / kontento' }, ['content', 'calm', 'at peace'], ['Philippians 4:11-12', 'John 14:27'], ['grateful', 'joyful', 'hopeful']),
  entry('emotion', 'hopeful', { en: 'Hopeful', tl: 'Umaasa', ceb: 'Malaumon', ilo: 'Addaan namnama' }, ['optimistic', 'expectant', 'hopeful'], ['Romans 15:13', 'Hebrews 10:23'], ['joyful', 'peaceful', 'excited']),
  entry('emotion', 'excited', { en: 'Excited', tl: 'Sabik', ceb: 'Excited / madasigon', ilo: 'Naragsak / magagaran' }, ['eager', 'thrilled', 'anticipating'], ['Psalm 126:3', 'Romans 12:11'], ['joyful', 'hopeful', 'grateful']),
  entry('emotion', 'connected', { en: 'Loving / connected', tl: 'Mapagmahal / konektado', ceb: 'Mahigugmaon / konektado', ilo: 'Nagayat / naikaykaysa' }, ['loved', 'loving', 'connected', 'close'], ['John 13:34-35', '1 John 4:7'], ['joyful', 'grateful', 'peaceful']),
]);

export const LIBRARY_NEEDS = Object.freeze([
  entry('need', 'peace', { en: 'Peace', tl: 'Kapayapaan', ceb: 'Kalinaw', ilo: 'Talna' }, ['calm', 'peace of mind'], ['John 14:27', 'Philippians 4:7'], ['rest', 'trust', 'comfort']),
  entry('need', 'hope', { en: 'Hope', tl: 'Pag-asa', ceb: 'Paglaom', ilo: 'Namnama' }, ['hope', 'something to hope for'], ['Romans 15:13', 'Hebrews 6:19'], ['encouragement', 'trust', 'renewal']),
  entry('need', 'comfort', { en: 'Comfort', tl: 'Kaaliwan', ceb: 'Kahupayan', ilo: 'Liwliwa' }, ['consolation', 'comforted'], ['2 Corinthians 1:3-4', 'Psalm 23:4'], ['peace', 'healing', 'connection']),
  entry('need', 'courage', { en: 'Courage', tl: 'Lakas ng loob', ceb: 'Kaisog', ilo: 'Tured' }, ['bravery', 'boldness'], ['Joshua 1:9', '2 Timothy 1:7'], ['strength', 'trust', 'encouragement']),
  entry('need', 'strength', { en: 'Strength', tl: 'Lakas', ceb: 'Kusog', ilo: 'Pigsa' }, ['energy', 'endurance'], ['Isaiah 40:31', 'Philippians 4:13'], ['rest', 'perseverance', 'courage']),
  entry('need', 'wisdom', { en: 'Wisdom', tl: 'Karunungan', ceb: 'Kaalam', ilo: 'Sirib' }, ['discernment', 'understanding'], ['James 1:5', 'Proverbs 2:6'], ['guidance', 'trust', 'patience']),
  entry('need', 'guidance', { en: 'Guidance', tl: 'Patnubay', ceb: 'Paggiya', ilo: 'Pannakaiturong' }, ['direction', 'next step', 'clarity'], ['Proverbs 3:5-6', 'Psalm 32:8'], ['wisdom', 'trust', 'patience']),
  entry('need', 'forgiveness', { en: 'Forgiveness', tl: 'Kapatawaran', ceb: 'Pagpasaylo', ilo: 'Pammakawan' }, ['forgiven', 'mercy'], ['1 John 1:9', 'Ephesians 1:7'], ['grace_identity', 'healing', 'renewal']),
  entry('need', 'grace_identity', { en: 'Grace / identity', tl: 'Biyaya / pagkakakilanlan', ceb: 'Grasya / pagkaila sa kaugalingon', ilo: 'Parabur / kinasiasino' }, ['grace', 'identity', 'worth', 'accepted'], ['Ephesians 2:8-10', '1 Peter 2:9'], ['forgiveness', 'connection', 'renewal']),
  entry('need', 'healing', { en: 'Healing', tl: 'Pagpapagaling', ceb: 'Pag-ayo', ilo: 'Pannakaagas' }, ['heal', 'restoration', 'mending'], ['Psalm 147:3', 'Jeremiah 17:14'], ['comfort', 'renewal', 'rest']),
  entry('need', 'rest', { en: 'Rest', tl: 'Pahinga', ceb: 'Pahulay', ilo: 'Inana' }, ['sleep', 'pause', 'recovery'], ['Matthew 11:28-30', 'Psalm 23:2'], ['peace', 'renewal', 'strength']),
  entry('need', 'renewal', { en: 'Renewal', tl: 'Pagpapanibago', ceb: 'Pagbag-o', ilo: 'Pannakapabaro' }, ['refreshing', 'fresh start', 'revival'], ['Isaiah 40:31', 'Romans 12:2'], ['rest', 'hope', 'healing']),
  entry('need', 'patience', { en: 'Patience', tl: 'Pasensya', ceb: 'Pailub', ilo: 'Anus' }, ['wait well', 'waiting'], ['Romans 12:12', 'James 5:7-8'], ['perseverance', 'trust', 'peace']),
  entry('need', 'perseverance', { en: 'Perseverance', tl: 'Pagtitiyaga', ceb: 'Paglahutay', ilo: 'Panagibtur' }, ['endurance', 'keep going', 'persistence'], ['Galatians 6:9', 'Hebrews 12:1'], ['strength', 'patience', 'encouragement']),
  entry('need', 'connection', { en: 'Connection', tl: 'Ugnayan', ceb: 'Koneksyon', ilo: 'Pannakikadua' }, ['community', 'belonging', 'friendship'], ['Hebrews 10:24-25', 'Ecclesiastes 4:9-10'], ['comfort', 'encouragement', 'grace_identity']),
  entry('need', 'self_control', { en: 'Self-control', tl: 'Pagpipigil sa sarili', ceb: 'Pagpugong sa kaugalingon', ilo: 'Panagtengngel iti bagi' }, ['discipline', 'control myself', 'resist'], ['Galatians 5:22-23', '2 Timothy 1:7'], ['wisdom', 'strength', 'patience']),
  entry('need', 'encouragement', { en: 'Encouragement', tl: 'Pagpapalakas ng loob', ceb: 'Pagdasig', ilo: 'Pammabileg ti nakem' }, ['encourage me', 'motivation', 'support'], ['1 Thessalonians 5:11', 'Isaiah 41:10'], ['hope', 'connection', 'perseverance']),
  entry('need', 'trust', { en: 'Trust', tl: 'Pagtitiwala', ceb: 'Pagsalig', ilo: 'Panagtalek' }, ['faith', 'rely on god', 'confidence'], ['Proverbs 3:5-6', 'Psalm 56:3'], ['peace', 'guidance', 'hope']),
  entry('need', 'celebration', { en: 'Celebration / thanksgiving', tl: 'Pagdiriwang / pasasalamat', ceb: 'Pagsaulog / pagpasalamat', ilo: 'Panagrambak / panagyaman' }, ['celebrate', 'thanksgiving', 'give thanks'], ['Psalm 100:1-5', '1 Thessalonians 5:16-18'], ['connection', 'hope', 'peace']),
]);

export const LIBRARY_DISCOVERY_CATALOG = Object.freeze({
  emotion: LIBRARY_EMOTIONS,
  need: LIBRARY_NEEDS,
});

const byKind = Object.freeze(Object.fromEntries(DISCOVERY_KINDS.map(kind => [kind, new Map(LIBRARY_DISCOVERY_CATALOG[kind].map(item => [item.id, item]))])));
const aliasIndex = Object.freeze(Object.fromEntries(DISCOVERY_KINDS.map(kind => {
  const aliases = new Map();
  for (const item of LIBRARY_DISCOVERY_CATALOG[kind]) {
    for (const alias of item.aliases) {
      if (aliases.has(alias) && aliases.get(alias) !== item.id) throw new Error(`Duplicate ${kind} discovery alias: ${alias}`);
      aliases.set(alias, item.id);
    }
  }
  return [kind, aliases];
})));

export function normalizeLibraryDiscoveryLocale(value) {
  const normalized = String(value || '').trim().toLowerCase().replace('_', '-').split('-')[0];
  return SUPPORTED_DISCOVERY_LOCALES.includes(normalized) ? normalized : 'en';
}

export function libraryDiscoveryLabel(item, locale = 'en') {
  const requested = normalizeLibraryDiscoveryLocale(locale);
  const label = item?.labels?.[requested] || item?.labels?.en || item?.id || '';
  return Object.freeze({ label, locale: item?.labels?.[requested] ? requested : 'en', fallback: !item?.labels?.[requested] });
}

export function libraryDiscoveryShellLabel(key, locale = 'en') {
  const requested = normalizeLibraryDiscoveryLocale(locale);
  const labels = LIBRARY_DISCOVERY_SHELL[key] || {};
  return labels[requested] || labels.en || String(key || '');
}

export function canonicalizeLibraryDiscoveryTerm(value, kind) {
  if (!DISCOVERY_KINDS.includes(kind)) return null;
  const normalized = normalizeDiscoveryText(value);
  const id = aliasIndex[kind].get(normalized) || (TOKEN_PATTERN.test(String(value || '').trim()) ? String(value).trim() : '');
  return id && byKind[kind].has(id) ? id : null;
}

const cleanFreeTag = value => {
  const token = String(value ?? '').trim().toLowerCase();
  return TOKEN_PATTERN.test(token) ? token : null;
};
const normalizeList = (values, kind) => Object.freeze([...new Set((Array.isArray(values) ? values : []).map(value => (
  kind ? canonicalizeLibraryDiscoveryTerm(value, kind) : cleanFreeTag(value)
)).filter(Boolean))].sort());

export function normalizeLibraryDiscoveryQuery(input = {}) {
  return Object.freeze({
    emotions: normalizeList(input.emotions, 'emotion'),
    needs: normalizeList(input.needs, 'need'),
    topics: normalizeList(input.topics),
    lifeSituations: normalizeList(input.lifeSituations),
  });
}

export function toggleLibraryDiscoverySelection(query, kind, value) {
  if (!DISCOVERY_KINDS.includes(kind)) throw new TypeError('Library discovery selection kind must be emotion or need.');
  const id = canonicalizeLibraryDiscoveryTerm(value, kind);
  if (!id) throw new TypeError(`Unknown Library ${kind} selection.`);
  const current = normalizeLibraryDiscoveryQuery(query);
  const key = kind === 'emotion' ? 'emotions' : 'needs';
  const selected = new Set(current[key]);
  if (selected.has(id)) selected.delete(id); else selected.add(id);
  return normalizeLibraryDiscoveryQuery({ ...current, [key]: [...selected] });
}

const ROUTE_KEYS = Object.freeze({ emotions: 'emotion', needs: 'need', topics: 'topic', lifeSituations: 'lifeSituation' });

export function serializeLibraryDiscoveryQuery(query, params = new URLSearchParams()) {
  const normalized = normalizeLibraryDiscoveryQuery(query);
  for (const [key, param] of Object.entries(ROUTE_KEYS)) {
    params.delete(param);
    for (const value of normalized[key]) params.append(param, value);
  }
  return params;
}

export function parseLibraryDiscoveryQuery(params) {
  const source = params instanceof URLSearchParams ? params : new URLSearchParams(String(params || ''));
  return normalizeLibraryDiscoveryQuery(Object.fromEntries(Object.entries(ROUTE_KEYS).map(([key, param]) => [key, source.getAll(param)])));
}

export function toLibraryDiscoveryRequest(query, locale = 'en') {
  const normalized = normalizeLibraryDiscoveryQuery(query);
  return Object.freeze({ ...normalized, locale: normalizeLibraryDiscoveryLocale(locale) });
}

export function getLibraryDiscoveryItem(kind, id) {
  return byKind[kind]?.get(String(id || '')) || null;
}

export function getLibraryDiscoveryEmptyState(query, locale = 'en', limit = 3) {
  const normalized = normalizeLibraryDiscoveryQuery(query);
  const selected = [
    ...normalized.emotions.map(id => getLibraryDiscoveryItem('emotion', id)),
    ...normalized.needs.map(id => getLibraryDiscoveryItem('need', id)),
  ].filter(Boolean);
  const selectedIds = new Set(selected.map(item => `${item.kind}:${item.id}`));
  const suggestions = [];
  const seen = new Set();
  for (const item of selected) {
    for (const adjacent of item.adjacent) {
      const candidate = getLibraryDiscoveryItem(item.kind, adjacent)
        || getLibraryDiscoveryItem(item.kind === 'emotion' ? 'need' : 'emotion', adjacent);
      if (!candidate) continue;
      const key = `${candidate.kind}:${candidate.id}`;
      if (selectedIds.has(key) || seen.has(key)) continue;
      seen.add(key);
      suggestions.push(candidate);
      if (suggestions.length >= Math.max(0, Math.floor(limit))) break;
    }
    if (suggestions.length >= Math.max(0, Math.floor(limit))) break;
  }
  const scriptures = [...new Set(selected.flatMap(item => item.scripture))].slice(0, 3);
  return Object.freeze({
    message: libraryDiscoveryShellLabel('noResults', locale),
    suggestions: Object.freeze(suggestions),
    scriptures: Object.freeze(scriptures),
  });
}

export const LIBRARY_DISCOVERY_LOCALES = SUPPORTED_DISCOVERY_LOCALES;

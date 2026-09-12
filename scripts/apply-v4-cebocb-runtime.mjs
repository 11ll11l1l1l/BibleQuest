import fs from 'node:fs';

function replaceOnce(source,before,after,label){
  const first=source.indexOf(before);
  if(first<0)throw new Error(`CEBOCB runtime migration could not find expected ${label} block.`);
  if(source.indexOf(before,first+before.length)>=0)throw new Error(`CEBOCB runtime migration found ${label} more than once.`);
  return source.slice(0,first)+after+source.slice(first+before.length);
}
function update(path,mutate){
  const before=fs.readFileSync(path,'utf8');
  const after=mutate(before);
  if(after===before)throw new Error(`CEBOCB runtime migration made no change to ${path}.`);
  fs.writeFileSync(path,after);
}

update('src/core/bible.js',source=>{
  source=replaceOnce(source,
    "  tl: Object.freeze({ id: 'tl', label: 'Tagalog · ULB', folder: 'tagalog', language: 'Tagalog', bundled: true, mode: 'bundled', source: 'Tagalog Unlocked Literal Bible', license: 'CC BY-SA 4.0', attribution: '© 2018 Door43 World Missions Community' }),\n",
    "  tl: Object.freeze({ id: 'tl', label: 'Tagalog · ULB', folder: 'tagalog', language: 'Tagalog', bundled: true, mode: 'bundled', source: 'Tagalog Unlocked Literal Bible', license: 'CC BY-SA 4.0', attribution: '© 2018 Door43 World Missions Community' }),\n  cebocb: Object.freeze({ id: 'cebocb', label: 'Cebuano/Bisaya · OCCB', folder: 'cebuano', language: 'Cebuano', bundled: true, mode: 'bundled', source: 'Biblica® Open Ang Pulong sa Dios™ / Biblica® Open Cebuano Contemporary Bible™ 2024', license: 'CC BY-SA 4.0', attribution: '© 2009, 2010, 2014, 2024 Biblica, Inc. · See data/packs/ATTRIBUTION.md' }),\n",
    'translation registry');

  source=replaceOnce(source,
    "const safeVerse = row => row && Number.isInteger(Number(row.c)) && Number(row.c) > 0 && Number.isInteger(Number(row.v)) && Number(row.v) > 0 && typeof row.t === 'string' && row.t.trim();\nconst freezeVerse = row => Object.freeze({ chapter: Number(row.c), verse: Number(row.v), text: String(row.t).trim() });\nconst referenceText = (book, chapter, verse = null) => `${book.name} ${chapter}${verse ? `:${verse}` : ''}`;\n",
    "const safeVerse = row => { const start=Number(row?.v),end=row?.e===undefined?start:Number(row.e); return row && Number.isInteger(Number(row.c)) && Number(row.c) > 0 && Number.isInteger(start) && start > 0 && Number.isInteger(end) && end >= start && typeof row.t === 'string' && row.t.trim(); };\nconst freezeVerse = row => { const start=Number(row.v),end=row.e===undefined?start:Number(row.e); return Object.freeze({ chapter: Number(row.c), verse: start, ...(end>start?{ verseEnd:end }:{}), text: String(row.t).trim() }); };\nconst verseEnd = verse => Number(verse?.verseEnd || verse?.verse || 0);\nconst verseLabel = verse => verseEnd(verse) > Number(verse?.verse) ? `${verse.verse}–${verseEnd(verse)}` : String(verse?.verse ?? '');\nconst referenceText = (book, chapter, verse = null) => `${book.name} ${chapter}${verse ? `:${verse}` : ''}`;\nconst verseReferenceText = (book, chapter, verse) => `${book.name} ${chapter}:${verseLabel(verse)}`;\n",
    'bundled verse model');

  source=replaceOnce(source,
    "    const seen = new Set();\n    for (const verse of verses) {\n      const verseKey = `${verse.chapter}:${verse.verse}`;\n      if (seen.has(verseKey)) throw new Error(`${translation.label} pack for ${book.name} contains duplicate verse ${verseKey}.`);\n      if (verse.chapter > book.chapters) throw new Error(`${translation.label} pack for ${book.name} contains invalid chapter ${verse.chapter}.`);\n      seen.add(verseKey);\n    }\n",
    "    const seen = new Set();\n    for (const verse of verses) {\n      if (verse.chapter > book.chapters) throw new Error(`${translation.label} pack for ${book.name} contains invalid chapter ${verse.chapter}.`);\n      const end=verseEnd(verse);\n      for(let number=verse.verse;number<=end;number++){\n        const verseKey = `${verse.chapter}:${number}`;\n        if (seen.has(verseKey)) throw new Error(`${translation.label} pack for ${book.name} contains duplicate or overlapping verse ${verseKey}.`);\n        seen.add(verseKey);\n      }\n    }\n",
    'bundled overlap validation');

  source=replaceOnce(source,
    "  const serializedPack = loaded => loaded.verses.map(verse => ({ c: verse.chapter, v: verse.verse, t: verse.text }));\n",
    "  const serializedPack = loaded => loaded.verses.map(verse => ({ c: verse.chapter, v: verse.verse, ...(verseEnd(verse)>verse.verse?{e:verseEnd(verse)}:{}), t: verse.text }));\n",
    'offline serialization');

  source=replaceOnce(source,
    "      const selected = parsed.verseStart === null ? chapter.verses : chapter.verses.filter(verse => verse.verse >= parsed.verseStart && verse.verse <= parsed.verseEnd);\n      return Object.freeze({ query: text, type: 'reference', results: Object.freeze(selected.slice(0, limit).map(verse => Object.freeze({ book: parsed.book, chapter: parsed.chapter, verse: verse.verse, text: verse.text, reference: referenceText(parsed.book, parsed.chapter, verse.verse) }))), skippedBooks: Object.freeze([]) });\n",
    "      const selected = parsed.verseStart === null ? chapter.verses : chapter.verses.filter(verse => verse.verse <= parsed.verseEnd && verseEnd(verse) >= parsed.verseStart);\n      return Object.freeze({ query: text, type: 'reference', results: Object.freeze(selected.slice(0, limit).map(verse => Object.freeze({ book: parsed.book, chapter: parsed.chapter, verse: verse.verse, ...(verseEnd(verse)>verse.verse?{verseEnd:verseEnd(verse)}:{}), text: verse.text, reference: verseReferenceText(parsed.book, parsed.chapter, verse) }))), skippedBooks: Object.freeze([]) });\n",
    'reference search');

  source=replaceOnce(source,
    "          results.push(Object.freeze({ book, chapter: verse.chapter, verse: verse.verse, text: verse.text, reference: referenceText(book, verse.chapter, verse.verse) }));\n",
    "          results.push(Object.freeze({ book, chapter: verse.chapter, verse: verse.verse, ...(verseEnd(verse)>verse.verse?{verseEnd:verseEnd(verse)}:{}), text: verse.text, reference: verseReferenceText(book, verse.chapter, verse) }));\n",
    'text search');
  return source;
});

update('src/app/reader.js',source=>{
  source=replaceOnce(source,
    "    if (!loaded.verses.some(item => item.verse === verse)) throw new Error('Search result verse is unavailable.');\n",
    "    if (!loaded.verses.some(item => item.verse <= verse && (item.verseEnd || item.verse) >= verse)) throw new Error('Search result verse is unavailable.');\n",
    'Reader search result range validation');
  source=replaceOnce(source,
    "    const found = loaded.verses.find(item => item.verse === number);\n    if (!found) throw new Error('Verse is unavailable.');\n    return Object.freeze({ ...found, reference: `${loaded.book.name} ${loaded.chapter}:${found.verse}`, links: bible.externalLinks(loaded.book.code, loaded.chapter, found.verse) });\n",
    "    const found = loaded.verses.find(item => item.verse <= number && (item.verseEnd || item.verse) >= number);\n    if (!found) throw new Error('Verse is unavailable.');\n    const label=(found.verseEnd || found.verse)>found.verse?`${found.verse}–${found.verseEnd}`:String(found.verse);\n    return Object.freeze({ ...found, reference: `${loaded.book.name} ${loaded.chapter}:${label}`, links: bible.externalLinks(loaded.book.code, loaded.chapter, number) });\n",
    'Reader peek range lookup');
  return source;
});

update('src/features/reader/index.js',source=>{
  source=replaceOnce(source,
    "const options = (items, value, key = 'id', label = 'label') => items.map(item => `<option value=\"${escapeHtml(item[key])}\" ${item[key] === value ? 'selected' : ''}>${escapeHtml(item[label])}</option>`).join('');\n",
    "const options = (items, value, key = 'id', label = 'label') => items.map(item => `<option value=\"${escapeHtml(item[key])}\" ${item[key] === value ? 'selected' : ''}>${escapeHtml(item[label])}</option>`).join('');\nconst verseLabel = verse => (verse?.verseEnd || verse?.verse) > verse?.verse ? `${verse.verse}–${verse.verseEnd}` : String(verse?.verse ?? '');\n",
    'Reader verse label helper');
  source=replaceOnce(source,
    "<span>${verse.verse}</span><p data-reader-verse-text>${escapeHtml(verse.text)}</p>",
    "<span>${verseLabel(verse)}</span><p data-reader-verse-text>${escapeHtml(verse.text)}</p>",
    'Reader rendered verse label');
  return source;
});

console.log('Applied BibleQuest V4 CEBOCB runtime integration patch to the existing Bible/Reader owners.');

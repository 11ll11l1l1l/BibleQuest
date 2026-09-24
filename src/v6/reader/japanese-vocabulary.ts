export type JapaneseVocabularyEntry = Readonly<{
  term: string;
  reading: string;
  meaning: string;
  simple: string;
  en?: string;
}>;

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function validEntry(entry: JapaneseVocabularyEntry): boolean {
  return Boolean(
    text(entry.term)
    && text(entry.reading)
    && text(entry.meaning)
    && text(entry.simple)
  );
}

export function canUseJapaneseVocabulary(translationId: string): boolean {
  return translationId === 'jko';
}

/**
 * DOM-independent curated Japanese vocabulary selection for Reader.
 * This function never invents readings/definitions: it only returns
 * provenance already present in the supplied reviewed vocabulary list.
 */
export function selectJapaneseVocabularyNotes(
  scriptureText: string,
  vocabulary: readonly JapaneseVocabularyEntry[],
  limit = 3,
): readonly JapaneseVocabularyEntry[] {
  const source = String(scriptureText ?? '');
  if (!source || !Number.isSafeInteger(limit) || limit < 1 || limit > 10) return Object.freeze([]);

  const valid = vocabulary
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => validEntry(entry))
    .sort((a, b) => {
      const byLength = text(b.entry.term).length - text(a.entry.term).length;
      return byLength || a.index - b.index;
    });

  const selected: JapaneseVocabularyEntry[] = [];
  const seen = new Set<string>();
  for (const { entry } of valid) {
    const term = text(entry.term);
    if (seen.has(term) || !source.includes(term)) continue;
    seen.add(term);
    selected.push(Object.freeze({
      term,
      reading: text(entry.reading),
      meaning: text(entry.meaning),
      simple: text(entry.simple),
      ...(text(entry.en) ? { en: text(entry.en) } : {}),
    }));
    if (selected.length >= limit) break;
  }
  return Object.freeze(selected);
}

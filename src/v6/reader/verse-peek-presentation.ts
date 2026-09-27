export type ReaderVersePeekLink = Readonly<{
  label: string;
  href: string;
}>;

export type ReaderVersePeekInput = Readonly<{
  verse: number;
  verseEnd?: number;
  reference: string;
  text: string;
  links: readonly ReaderVersePeekLink[];
}>;

export type ReaderVersePeekPresentation = Readonly<{
  verse: number;
  verseEnd?: number;
  reference: string;
  text: string;
  links: readonly ReaderVersePeekLink[];
}>;

function requiredText(value: string, label: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`Reader Verse Peek requires ${label}.`);
  return normalized;
}

function safeExternalHref(value: string): string {
  const href = requiredText(value, 'an external link');
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    throw new Error('Reader Verse Peek rejected an invalid external link.');
  }
  if (url.protocol !== 'https:') {
    throw new Error('Reader Verse Peek requires HTTPS external links.');
  }
  return url.href;
}

/**
 * Pure Verse Peek presentation seam.
 *
 * It validates the resolved Scripture projection and external links before the
 * route writes anything into the dialog. It owns no DOM or Reader navigation.
 */
export function presentReaderVersePeek(input: ReaderVersePeekInput): ReaderVersePeekPresentation {
  if (!Number.isInteger(input?.verse) || input.verse < 1) {
    throw new Error('Reader Verse Peek requires a positive verse.');
  }
  const verseEnd = input.verseEnd ?? input.verse;
  if (!Number.isInteger(verseEnd) || verseEnd < input.verse) {
    throw new Error('Reader Verse Peek requires a valid verse range.');
  }
  if (!Array.isArray(input.links)) {
    throw new Error('Reader Verse Peek requires an external-link list.');
  }

  const links = input.links.map((link) => Object.freeze({
    label: requiredText(link.label, 'an external-link label'),
    href: safeExternalHref(link.href),
  }));

  return Object.freeze({
    verse: input.verse,
    ...(input.verseEnd === undefined ? {} : { verseEnd: input.verseEnd }),
    reference: requiredText(input.reference, 'a Scripture reference'),
    text: requiredText(input.text, 'non-blank Scripture text'),
    links: Object.freeze(links),
  });
}

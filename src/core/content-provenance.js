const rows = {
  'bq-study': {
    id: 'bq-study',
    label: 'BibleQuest study material',
    kind: 'study',
    detail: 'BibleQuest-authored study prompts. Scripture references are provided for checking the biblical text; this prose is not a Bible quotation.'
  },
  'bq-retelling': {
    id: 'bq-retelling',
    label: 'BibleQuest retelling',
    kind: 'story',
    detail: 'A BibleQuest-authored summary of the cited biblical account. It is a retelling, not Bible translation text.'
  },
  'bq-wisdom': {
    id: 'bq-wisdom',
    label: 'BibleQuest wisdom / application',
    kind: 'application',
    detail: 'BibleQuest-authored application material supported by the listed Scripture references; it is not a direct Scripture quotation.'
  },
  'bq-recall': {
    id: 'bq-recall',
    label: 'BibleQuest recall / context question',
    kind: 'question',
    detail: 'BibleQuest-authored question and explanation. The displayed Scripture reference is the place to verify the answer; the explanation is not a Bible quotation.'
  }
};

const CATALOG = Object.freeze(Object.fromEntries(Object.entries(rows).map(([id, row]) => [id, Object.freeze({ ...row })])));

export function getContentProvenance(id) {
  const item = CATALOG[String(id || '')];
  if (!item) throw new Error(`Unknown content provenance: ${id || 'missing'}.`);
  return item;
}

export const CONTENT_PROVENANCE = CATALOG;

const REQUIRED_LIBRARY_TYPES = Object.freeze(['book', 'devotional', 'past_teaching']);

const BLOCKER_ORDER = Object.freeze([
  'fixture_source',
  'rights_unverified',
  'review_unapproved',
  'not_published'
]);

function itemBlockers(item) {
  const blockers = [];
  if (item?.source?.kind === 'fixture') blockers.push('fixture_source');
  if (item?.rights?.status !== 'verified') blockers.push('rights_unverified');
  if (item?.review?.status !== 'approved') blockers.push('review_unapproved');
  if (item?.publicationState !== 'published') blockers.push('not_published');
  return Object.freeze(blockers.sort((a, b) => BLOCKER_ORDER.indexOf(a) - BLOCKER_ORDER.indexOf(b)));
}

function freezeCandidate(item) {
  return Object.freeze({
    id: item.id,
    revision: item.revision,
    sourceLocale: item.sourceLocale,
    blockers: itemBlockers(item)
  });
}

/**
 * Assess whether the representative Library set can satisfy the V7 content gate.
 *
 * Input items are expected to have already passed parseV7ContentBundle(). The
 * assessment deliberately does not approve or publish content; it only reports
 * whether at least one non-fixture, rights-verified, review-approved, published
 * item exists for each required Library type.
 */
export function assessV7RepresentativeLibraryContent(items) {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');

  const byType = {};
  for (const type of REQUIRED_LIBRARY_TYPES) {
    const candidates = items.filter(item => item?.type === type).map(freezeCandidate);
    const readyItems = candidates.filter(candidate => candidate.blockers.length === 0);
    const blockerCodes = [...new Set(candidates.flatMap(candidate => candidate.blockers))]
      .sort((a, b) => BLOCKER_ORDER.indexOf(a) - BLOCKER_ORDER.indexOf(b));

    byType[type] = Object.freeze({
      ready: readyItems.length > 0,
      candidateCount: candidates.length,
      readyItemIds: Object.freeze(readyItems.map(candidate => candidate.id)),
      blockerCodes: Object.freeze(candidates.length ? blockerCodes : ['missing_representative_content']),
      candidates: Object.freeze(candidates)
    });
  }

  return Object.freeze({
    ready: REQUIRED_LIBRARY_TYPES.every(type => byType[type].ready),
    requiredTypes: REQUIRED_LIBRARY_TYPES,
    types: Object.freeze(byType)
  });
}

export const V7_REPRESENTATIVE_LIBRARY_TYPES = REQUIRED_LIBRARY_TYPES;

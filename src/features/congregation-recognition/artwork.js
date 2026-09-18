// BibleQuest V5 Phase 3: reviewed Congregation Recognition artwork mapping.
// Only genuine one-to-one matches in the existing Progress semantic icon set
// are wired. Unmatched recognition concepts remain decorative glyphs rather
// than being forced onto unrelated artwork.
const ASSET = 'assets/progress-feature-icons.svg';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const MATCHED = Object.freeze({
  consistency: Object.freeze({ symbol: 'streak', reason: 'Consistency is represented by the existing streak/flame semantic icon.' }),
  'scripture-explorer': Object.freeze({ symbol: 'chapter', reason: 'Scripture Explorer is represented by the existing open-book/chapter semantic icon.' }),
  comeback: Object.freeze({ symbol: 'growth', reason: 'Comeback is represented by the existing growth/sprout semantic icon.' }),
  'most-improved': Object.freeze({ symbol: 'progress', reason: 'Most Improved is represented by the existing progress/chart semantic icon.' }),
  'pastor-recognition': Object.freeze({ symbol: 'badge', reason: 'Pastor / Leader Recognition is represented by the existing award-badge semantic icon.' })
});

const EXCEPTIONS = Object.freeze({
  encourager: 'No genuine one-to-one heart/encourager symbol exists in the current approved semantic asset set.',
  'journey-finisher': 'No genuine one-to-one journey/map completion symbol exists in the current approved semantic asset set.',
  'group-helper': 'No genuine one-to-one helping-hands/group-helper symbol exists in the current approved semantic asset set.',
  reflection: 'No genuine one-to-one reflection/thought symbol exists in the current approved semantic asset set.'
});

export const recognitionArtworkContract = Object.freeze({
  asset: ASSET,
  matched: MATCHED,
  exceptions: EXCEPTIONS
});

export function recognitionArtwork(awardCode) {
  const match = MATCHED[String(awardCode || '')];
  return match ? Object.freeze({ asset: ASSET, symbol: match.symbol }) : null;
}

export function renderRecognitionArtwork(awardCode, fallbackGlyph = '') {
  const code = String(awardCode || '');
  const match = recognitionArtwork(code);
  if (match) {
    return `<svg class="bq-recognition-icon" data-recognition-art="${esc(match.symbol)}" aria-hidden="true" focusable="false" width="24" height="24"><use href="${esc(match.asset)}#${esc(match.symbol)}"></use></svg>`;
  }
  return `<span class="bq-recognition-icon" data-recognition-glyph="${esc(code)}" aria-hidden="true">${esc(fallbackGlyph)}</span>`;
}

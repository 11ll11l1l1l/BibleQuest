import { createBibleDataService } from '../core/bible.js';
import { offlineScriptureEligibility } from '../v6/reader/offline-availability.ts';

const probeNetworkFailure = async () => {
  throw new TypeError('Offline Scripture availability probe does not use the network.');
};

const frozenStatus = (translation, book, values) => Object.freeze({
  translationId: translation.id,
  bookCode: book.code,
  ...values
});

export function createOfflineScriptureAvailability({
  bibleService,
  probeService = createBibleDataService({ fetcher: probeNetworkFailure })
} = {}) {
  if (!bibleService?.getTranslation || !bibleService?.getBook) {
    throw new TypeError('bibleService with getTranslation() and getBook() is required.');
  }
  if (!probeService?.loadBook) {
    throw new TypeError('probeService with loadBook() is required.');
  }

  async function getStatus(translationId, bookCode) {
    const translation = bibleService.getTranslation(translationId);
    const book = bibleService.getBook(bookCode);

    const eligibility = offlineScriptureEligibility(translation.id);
    if (!eligibility.eligible) {
      return frozenStatus(translation, book, {
        available: false,
        supported: false,
        reason: eligibility.reason === 'external-only'
          ? 'This translation opens in a licensed external reader and is not cached by BibleQuest.'
          : eligibility.reason === 'live-only'
            ? 'This live translation requires a network connection.'
            : 'Offline Scripture is not approved for this translation.'
      });
    }

    if (!translation.bundled || translation.mode !== 'bundled') {
      return frozenStatus(translation, book, {
        available: false,
        supported: false,
        reason: 'Offline eligibility metadata does not match the current Reader delivery mode.'
      });
    }

    try {
      await probeService.loadBook(translation.id, book.code, { persistOffline: false });
      return frozenStatus(translation, book, {
        available: true,
        supported: true,
        reason: 'Available offline.'
      });
    } catch (error) {
      const message = String(error?.message || '');
      if (/malformed and was removed/i.test(message)) {
        return frozenStatus(translation, book, {
          available: false,
          supported: true,
          reason: 'The saved offline copy was invalid and was removed. Reconnect and open this book again.'
        });
      }
      return frozenStatus(translation, book, {
        available: false,
        supported: true,
        reason: 'Open this book while online before using it offline.'
      });
    }
  }

  return Object.freeze({ getStatus });
}
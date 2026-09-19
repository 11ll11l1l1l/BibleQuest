import type { ReaderLocation, ReaderProgress, ReaderProgressRepository } from './contracts.ts';
import type { ReaderNavigationCatalog } from './navigation.ts';
import { normalizeReaderLocation } from './navigation.ts';

/**
 * Creates the canonical Reader progress command after validating the reference.
 * Scripture delivery remains read-only; progress persistence is deliberately
 * isolated behind ReaderProgressRepository.
 */
export function createReaderProgress(
  location: ReaderLocation,
  readAt: string,
  catalog: ReaderNavigationCatalog,
): ReaderProgress {
  const normalized = normalizeReaderLocation(location, catalog);
  const timestamp = new Date(readAt);
  if (!readAt || Number.isNaN(timestamp.getTime())) throw new Error('Reader progress requires a valid readAt timestamp.');
  return Object.freeze({ location: normalized, readAt: timestamp.toISOString() });
}

/**
 * Record only after a chapter/reference has been successfully presented.
 * Callers own that presentation decision; this seam prevents content providers
 * from acquiring an implicit write side effect during migration.
 */
export async function recordReaderProgress(
  repository: ReaderProgressRepository,
  location: ReaderLocation,
  readAt: string,
  catalog: ReaderNavigationCatalog,
): Promise<ReaderProgress> {
  const progress = createReaderProgress(location, readAt, catalog);
  await repository.recordRead(progress);
  return progress;
}

import type { ScriptureTranslationManifest } from './content-manifest.ts';
import { validateScriptureManifest } from './content-manifest.ts';
import { translationPackagingPolicy } from './license-policy.ts';

export const CANONICAL_BIBLE_BOOK_CODES = Object.freeze([
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
  'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV',
] as const);

export interface ScriptureInventoryEntry {
  readonly code: string;
  readonly path: string;
}

export interface ScriptureInventoryAudit {
  readonly complete: boolean;
  readonly expectedBooks: number;
  readonly discoveredBooks: number;
  readonly missing: readonly string[];
  readonly extra: readonly string[];
  readonly duplicates: readonly string[];
}

export interface FullTranslationOfflineEligibility {
  readonly eligible: boolean;
  readonly reason: 'eligible' | 'inventory-incomplete' | 'manifest-invalid' | 'manifest-incomplete' | 'policy-mismatch' | 'redistribution-not-allowed';
  readonly inventory: ScriptureInventoryAudit;
}

function normalizedCode(value: string): string {
  return String(value ?? '').trim().toUpperCase();
}

export function auditCanonicalScriptureInventory(entries: readonly ScriptureInventoryEntry[]): ScriptureInventoryAudit {
  const expected = new Set<string>(CANONICAL_BIBLE_BOOK_CODES);
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const code = normalizedCode(entry.code);
    if (!code || !String(entry.path ?? '').trim()) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const discovered = [...counts.keys()];
  const missing = CANONICAL_BIBLE_BOOK_CODES.filter((code) => !counts.has(code));
  const extra = discovered.filter((code) => !expected.has(code)).sort();
  const duplicates = discovered.filter((code) => (counts.get(code) ?? 0) > 1).sort();
  return Object.freeze({
    complete: missing.length === 0 && extra.length === 0 && duplicates.length === 0,
    expectedBooks: CANONICAL_BIBLE_BOOK_CODES.length,
    discoveredBooks: discovered.length,
    missing: Object.freeze([...missing]),
    extra: Object.freeze(extra),
    duplicates: Object.freeze(duplicates),
  });
}

export function fullTranslationOfflineEligibility(
  manifest: ScriptureTranslationManifest,
  inventoryEntries: readonly ScriptureInventoryEntry[],
): FullTranslationOfflineEligibility {
  const inventory = auditCanonicalScriptureInventory(inventoryEntries);
  if (!inventory.complete) return Object.freeze({ eligible: false, reason: 'inventory-incomplete' as const, inventory });

  const validation = validateScriptureManifest(manifest);
  if (!validation.valid) return Object.freeze({ eligible: false, reason: 'manifest-invalid' as const, inventory });

  const manifestInventory = auditCanonicalScriptureInventory(manifest.books.map((book) => ({ code: book.bookCode, path: book.url })));
  if (!manifestInventory.complete) return Object.freeze({ eligible: false, reason: 'manifest-incomplete' as const, inventory });

  const policy = translationPackagingPolicy(manifest.translationId);
  if (!policy || policy.delivery !== manifest.delivery) {
    return Object.freeze({ eligible: false, reason: 'policy-mismatch' as const, inventory });
  }
  if (policy.license.redistribution !== 'allowed' || manifest.license.redistribution !== 'allowed') {
    return Object.freeze({ eligible: false, reason: 'redistribution-not-allowed' as const, inventory });
  }
  return Object.freeze({ eligible: true, reason: 'eligible' as const, inventory });
}

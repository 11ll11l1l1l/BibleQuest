export type RedistributionPolicy = 'allowed' | 'forbidden' | 'review-required';
export type ContentDelivery = 'bundled' | 'downloadable' | 'live' | 'external';

export interface ScriptureLicenseMetadata {
  readonly source: string;
  readonly license: string;
  readonly attribution: string;
  readonly redistribution: RedistributionPolicy;
}

export interface ScriptureBookPackage {
  readonly bookCode: string;
  readonly url: string;
  readonly sha256: string;
  readonly bytes?: number;
}

export interface ScriptureTranslationManifest {
  readonly schemaVersion: 1;
  readonly translationId: string;
  readonly label: string;
  readonly contentVersion: string;
  readonly delivery: ContentDelivery;
  readonly license: ScriptureLicenseMetadata;
  readonly books: readonly ScriptureBookPackage[];
}

export interface ManifestValidation {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/i;
const BOOK_RE = /^(?:[1-3])?[A-Z]{2,3}$/;
const SHA256_RE = /^[a-f0-9]{64}$/i;

function text(value: unknown): string {
  return String(value ?? '').trim();
}

export function validateScriptureManifest(manifest: ScriptureTranslationManifest): ManifestValidation {
  const issues: string[] = [];
  if (manifest.schemaVersion !== 1) issues.push('unsupported schema version');
  if (!ID_RE.test(text(manifest.translationId))) issues.push('invalid translation id');
  if (!text(manifest.label)) issues.push('translation label is required');
  if (!text(manifest.contentVersion)) issues.push('content version is required');
  if (!text(manifest.license?.source)) issues.push('source metadata is required');
  if (!text(manifest.license?.license)) issues.push('license metadata is required');
  if (!text(manifest.license?.attribution)) issues.push('attribution metadata is required');

  const packaged = manifest.delivery === 'bundled' || manifest.delivery === 'downloadable';
  if (packaged && manifest.license?.redistribution !== 'allowed') {
    issues.push('packaged content requires explicit redistribution permission');
  }
  if (!packaged && manifest.books.length > 0) issues.push('live/external translations cannot declare downloadable packages');

  const seen = new Set<string>();
  for (const book of manifest.books) {
    const code = text(book.bookCode).toUpperCase();
    if (!BOOK_RE.test(code)) issues.push(`invalid book code: ${code || 'missing'}`);
    if (seen.has(code)) issues.push(`duplicate book package: ${code}`);
    seen.add(code);
    if (!text(book.url)) issues.push(`package URL is required for ${code || 'unknown book'}`);
    if (!SHA256_RE.test(text(book.sha256))) issues.push(`valid sha256 is required for ${code || 'unknown book'}`);
    if (book.bytes !== undefined && (!Number.isSafeInteger(book.bytes) || book.bytes <= 0)) {
      issues.push(`positive byte size required for ${code || 'unknown book'}`);
    }
  }

  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) });
}

export function assertScriptureDownloadAllowed(manifest: ScriptureTranslationManifest): true {
  const validation = validateScriptureManifest(manifest);
  if (!validation.valid) throw new Error(`Scripture manifest is invalid: ${validation.issues.join('; ')}`);
  if (manifest.license.redistribution !== 'allowed') throw new Error('Scripture redistribution is not approved for offline packaging.');
  if (manifest.delivery !== 'bundled' && manifest.delivery !== 'downloadable') {
    throw new Error('This translation is not an offline-package delivery mode.');
  }
  return true;
}

export function scripturePackageKey(manifest: ScriptureTranslationManifest, book: ScriptureBookPackage): string {
  assertScriptureDownloadAllowed(manifest);
  return `${manifest.translationId}:${manifest.contentVersion}:${book.bookCode.toUpperCase()}:${book.sha256.toLowerCase()}`;
}

export function packageNeedsUpdate(
  installed: Pick<ScriptureBookPackage, 'bookCode' | 'sha256'> | null | undefined,
  expected: ScriptureBookPackage,
): boolean {
  if (!installed) return true;
  return installed.bookCode.toUpperCase() !== expected.bookCode.toUpperCase() || installed.sha256.toLowerCase() !== expected.sha256.toLowerCase();
}

export async function sha256Hex(data: ArrayBuffer | ArrayBufferView, subtle: SubtleCrypto = globalThis.crypto.subtle): Promise<string> {
  const source = ArrayBuffer.isView(data)
    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    : data;
  const digest = await subtle.digest('SHA-256', source);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyPackageChecksum(
  data: ArrayBuffer | ArrayBufferView,
  expectedSha256: string,
  subtle: SubtleCrypto = globalThis.crypto.subtle,
): Promise<boolean> {
  if (!SHA256_RE.test(expectedSha256)) return false;
  return (await sha256Hex(data, subtle)) === expectedSha256.toLowerCase();
}

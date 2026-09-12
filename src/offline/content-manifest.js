const SHA256_HEX = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/;
const BOOK_CODE = /^[A-Z0-9]{2,8}$/;
const ALLOWED_SCOPES = new Set(['book', 'translation']);

function requiredString(value, field) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function safeId(value, field) {
  const normalized = requiredString(value, field).toLowerCase();
  if (!SAFE_ID.test(normalized)) throw new Error(`${field} is invalid.`);
  return normalized;
}

function contentPath(value) {
  const normalized = requiredString(value, 'contentPath');
  if (!normalized.startsWith('/') || normalized.startsWith('//') || normalized.includes('\\')) {
    throw new Error('contentPath must be an absolute same-origin path.');
  }
  const url = new URL(normalized, 'https://biblequest.invalid');
  if (url.origin !== 'https://biblequest.invalid' || url.username || url.password || url.hash) {
    throw new Error('contentPath must remain same-origin.');
  }
  if (url.pathname.split('/').some(part => part === '..' || part === '.')) {
    throw new Error('contentPath must not traverse directories.');
  }
  return `${url.pathname}${url.search}`;
}

function checksum(input) {
  if (!input || String(input.algorithm ?? '').toLowerCase() !== 'sha256') {
    throw new Error('checksum.algorithm must be sha256.');
  }
  const value = String(input.value ?? '').trim().toLowerCase();
  if (!SHA256_HEX.test(value)) throw new Error('checksum.value must be a 64-character SHA-256 hex digest.');
  return Object.freeze({ algorithm: 'sha256', value });
}

function license(input) {
  if (!input || input.redistributionAllowed !== true) {
    throw new Error('Offline Scripture packages require explicit redistribution permission.');
  }
  return Object.freeze({
    redistributionAllowed: true,
    source: requiredString(input.source, 'license.source'),
    notice: String(input.notice ?? '').trim()
  });
}

function books(input, scope) {
  if (!Array.isArray(input) || input.length === 0) throw new Error('books must contain at least one book code.');
  const normalized = input.map(value => requiredString(value, 'book').toUpperCase());
  if (normalized.some(value => !BOOK_CODE.test(value))) throw new Error('books contains an invalid book code.');
  if (new Set(normalized).size !== normalized.length) throw new Error('books must not contain duplicates.');
  if (scope === 'book' && normalized.length !== 1) throw new Error('book-scoped packages must contain exactly one book.');
  return Object.freeze(normalized);
}

export function validateScriptureManifest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('manifest must be an object.');
  if (input.schemaVersion !== 1) throw new Error('Unsupported Scripture manifest schemaVersion.');

  const scope = requiredString(input.scope, 'scope').toLowerCase();
  if (!ALLOWED_SCOPES.has(scope)) throw new Error('scope must be book or translation.');

  const byteSize = Number(input.byteSize);
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0) throw new Error('byteSize must be a positive safe integer.');

  const generatedAt = requiredString(input.generatedAt, 'generatedAt');
  const timestamp = Date.parse(generatedAt);
  if (!Number.isFinite(timestamp)) throw new Error('generatedAt must be a valid timestamp.');

  const normalized = {
    schemaVersion: 1,
    packageId: safeId(input.packageId, 'packageId'),
    translationId: safeId(input.translationId, 'translationId'),
    contentVersion: safeId(input.contentVersion, 'contentVersion'),
    scope,
    books: books(input.books, scope),
    contentPath: contentPath(input.contentPath),
    byteSize,
    generatedAt: new Date(timestamp).toISOString(),
    checksum: checksum(input.checksum),
    license: license(input.license)
  };

  return Object.freeze(normalized);
}

export function scripturePackageKey(manifest) {
  const value = validateScriptureManifest(manifest);
  return `${value.translationId}:${value.contentVersion}:${value.scope}:${value.books.join(',')}`;
}

const PREFIX = 'biblequest.v3.';
const AUTH_PREFIX = 'auth.';
const PRIVATE_PREFIX = 'private.';
const DEVICE_ID = 'device-id';
const NAME_RE = /^[a-z0-9._-]+$/i;

function key(name) {
  if (!NAME_RE.test(name)) throw new Error('Invalid storage key.');
  return PREFIX + name;
}

function authKey(name) {
  return `${PREFIX}${AUTH_PREFIX}${encodeURIComponent(String(name))}`;
}

function privateKey(name) {
  const normalized = String(name || '').trim();
  if (!normalized) throw new Error('Private storage key is required.');
  return `${PREFIX}${PRIVATE_PREFIX}${encodeURIComponent(normalized)}`;
}

function backing() {
  if (typeof localStorage === 'undefined') throw new Error('Local device storage is unavailable.');
  return localStorage;
}

function isPortableName(name) {
  return NAME_RE.test(name) && name !== DEVICE_ID && !name.startsWith(AUTH_PREFIX) && !name.startsWith(PRIVATE_PREFIX);
}

function portableEntries(store = backing()) {
  const entries = [];
  for (let index = 0; index < store.length; index += 1) {
    const rawKey = store.key(index);
    if (!rawKey?.startsWith(PREFIX)) continue;
    const name = rawKey.slice(PREFIX.length);
    if (!isPortableName(name)) continue;
    const raw = store.getItem(rawKey);
    let value;
    try { value = JSON.parse(raw); }
    catch { throw new Error(`BibleQuest local state "${name}" is malformed and cannot be exported.`); }
    entries.push(Object.freeze({ name, value }));
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

function validatePortableEntries(entries) {
  if (!Array.isArray(entries)) throw new Error('Backup entries must be an array.');
  const seen = new Set();
  return entries.map(entry => {
    const name = String(entry?.name || '');
    if (!isPortableName(name)) throw new Error(`Backup contains a non-portable storage key: ${name || 'missing'}.`);
    if (seen.has(name)) throw new Error(`Backup contains duplicate storage key: ${name}.`);
    seen.add(name);
    let value;
    try { value = JSON.parse(JSON.stringify(entry?.value)); }
    catch { throw new Error(`Backup value for ${name} is not valid JSON data.`); }
    return Object.freeze({ name, value });
  });
}

function replacePortableEntries(entries) {
  const store = backing();
  const incoming = validatePortableEntries(entries);
  const before = portableEntries(store);
  const currentKeys = [];
  for (let index = 0; index < store.length; index += 1) {
    const rawKey = store.key(index);
    if (!rawKey?.startsWith(PREFIX)) continue;
    const name = rawKey.slice(PREFIX.length);
    if (isPortableName(name)) currentKeys.push(rawKey);
  }
  try {
    for (const rawKey of currentKeys) store.removeItem(rawKey);
    for (const entry of incoming) store.setItem(key(entry.name), JSON.stringify(entry.value));
  } catch (error) {
    try {
      const rollbackKeys = [];
      for (let index = 0; index < store.length; index += 1) {
        const rawKey = store.key(index);
        if (!rawKey?.startsWith(PREFIX)) continue;
        const name = rawKey.slice(PREFIX.length);
        if (isPortableName(name)) rollbackKeys.push(rawKey);
      }
      for (const rawKey of rollbackKeys) store.removeItem(rawKey);
      for (const entry of before) store.setItem(key(entry.name), JSON.stringify(entry.value));
    } catch {}
    throw new Error(`BibleQuest local state could not be replaced: ${error?.message || 'storage write failed'}`);
  }
  return incoming.length;
}

export const storage = Object.freeze({
  read(name, fallback = null) {
    try {
      const raw = localStorage.getItem(key(name));
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  write(name, value) {
    localStorage.setItem(key(name), JSON.stringify(value));
    return value;
  },
  remove(name) {
    localStorage.removeItem(key(name));
  },
  exportPortableEntries() {
    return Object.freeze(portableEntries().map(entry => Object.freeze({ name: entry.name, value: entry.value })));
  },
  replacePortableEntries(entries) {
    return replacePortableEntries(entries);
  },
  resetPortableEntries() {
    return replacePortableEntries([]);
  }
});

export const privateStorage = Object.freeze({
  read(name, fallback = null) {
    try {
      const raw = backing().getItem(privateKey(name));
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  write(name, value) {
    backing().setItem(privateKey(name), JSON.stringify(value));
    return value;
  },
  remove(name) {
    try { backing().removeItem(privateKey(name)); }
    catch {}
  }
});

export const authStorage = Object.freeze({
  getItem(name) {
    try { return localStorage.getItem(authKey(name)); }
    catch { return null; }
  },
  setItem(name, value) {
    localStorage.setItem(authKey(name), String(value));
  },
  removeItem(name) {
    localStorage.removeItem(authKey(name));
  }
});

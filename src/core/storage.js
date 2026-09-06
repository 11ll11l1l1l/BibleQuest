const PREFIX = 'biblequest.v3.';

function key(name) {
  if (!/^[a-z0-9._-]+$/i.test(name)) throw new Error('Invalid storage key.');
  return PREFIX + name;
}

function authKey(name) {
  return `${PREFIX}auth.${encodeURIComponent(String(name))}`;
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

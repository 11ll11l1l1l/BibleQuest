const PREFIX = 'biblequest.v3.';

function key(name) {
  if (!/^[a-z0-9._-]+$/i.test(name)) throw new Error('Invalid storage key.');
  return PREFIX + name;
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

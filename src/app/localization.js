import { storage } from '../core/storage.js';
import { en, LOCALE_KEY_INVENTORY } from '../content/locales/en.js';
import { tl } from '../content/locales/tl.js';
import { ceb } from '../content/locales/ceb.js';
import { v5CloseoutLocales } from '../content/locales/v5-closeout.js';

const STORAGE_KEY = 'locale';
const DEFAULT_LOCALE = 'en';
const dictionaries = Object.freeze({
  en: Object.freeze({ ...en, ...v5CloseoutLocales.en }),
  tl: Object.freeze({ ...tl, ...v5CloseoutLocales.tl }),
  ceb: Object.freeze({ ...ceb, ...v5CloseoutLocales.ceb })
});
const supportedLocales = Object.freeze(Object.keys(dictionaries));

function normalizeLocale(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return DEFAULT_LOCALE;
  const base = raw.split(/[-_]/)[0];
  return supportedLocales.includes(base) ? base : DEFAULT_LOCALE;
}

function interpolate(message, values = {}) {
  return String(message).replace(/\{([a-z0-9_.-]+)\}/gi, (match, name) => (
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
  ));
}

export function getLocale() {
  return normalizeLocale(storage.read(STORAGE_KEY, DEFAULT_LOCALE));
}

export function setLocale(locale) {
  const normalized = normalizeLocale(locale);
  storage.write(STORAGE_KEY, normalized);
  return normalized;
}

export function getMissingLocaleKeys(locale, localeDictionaries = dictionaries) {
  const normalized = normalizeLocale(locale);
  const dictionary = localeDictionaries[normalized] || {};
  return LOCALE_KEY_INVENTORY.filter(key => !String(dictionary[key] ?? '').trim());
}

export function t(key, options = {}) {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey) return '';

  const locale = normalizeLocale(options.locale ?? getLocale());
  const localeDictionary = options.dictionaries?.[locale] || dictionaries[locale] || {};
  const englishDictionary = options.dictionaries?.en || dictionaries.en;
  const message = localeDictionary[normalizedKey] || englishDictionary[normalizedKey] || normalizedKey;
  return interpolate(message, options.values);
}

export const localization = Object.freeze({
  DEFAULT_LOCALE,
  supportedLocales,
  keyInventory: LOCALE_KEY_INVENTORY,
  getLocale,
  setLocale,
  t,
  getMissingLocaleKeys
});

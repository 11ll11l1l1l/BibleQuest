import { createVersionedJsonStore, type KeyValueStorage } from '../platform/persistence.ts';

export const NOTIFICATION_CATEGORIES = Object.freeze([
  'reading',
  'assignments',
  'ministry',
  'announcements',
  'encouragement',
  'streaks',
] as const);

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export interface QuietHours {
  readonly enabled: boolean;
  readonly start: string;
  readonly end: string;
}

export interface NotificationPreferences {
  readonly masterEnabled: boolean;
  readonly categories: Readonly<Record<NotificationCategory, boolean>>;
  readonly quietHours: QuietHours;
}

const VERSION = 1;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function defaultNotificationPreferences(): NotificationPreferences {
  return Object.freeze({
    masterEnabled: true,
    categories: Object.freeze(Object.fromEntries(NOTIFICATION_CATEGORIES.map((key) => [key, true])) as Record<NotificationCategory, boolean>),
    quietHours: Object.freeze({ enabled: false, start: '22:00', end: '07:00' }),
  });
}

function cleanTime(value: unknown, fallback: string): string {
  const text = String(value ?? '').trim();
  return TIME_RE.test(text) ? text : fallback;
}

export function normalizeNotificationPreferences(input: Partial<NotificationPreferences> | null | undefined): NotificationPreferences {
  const defaults = defaultNotificationPreferences();
  const sourceCategories = input?.categories ?? defaults.categories;
  const categories = Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((key) => [key, sourceCategories[key] !== false]),
  ) as Record<NotificationCategory, boolean>;
  const quiet = input?.quietHours;

  return Object.freeze({
    masterEnabled: input?.masterEnabled !== false,
    categories: Object.freeze(categories),
    quietHours: Object.freeze({
      enabled: quiet?.enabled === true,
      start: cleanTime(quiet?.start, defaults.quietHours.start),
      end: cleanTime(quiet?.end, defaults.quietHours.end),
    }),
  });
}

export function minutesOfDay(value: string): number {
  if (!TIME_RE.test(value)) throw new Error('Time must use HH:MM.');
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function isQuietMinute(preferences: NotificationPreferences, minuteOfDay: number): boolean {
  if (!preferences.masterEnabled || !preferences.quietHours.enabled) return false;
  const current = Math.max(0, Math.min(1439, Math.floor(minuteOfDay)));
  const start = minutesOfDay(preferences.quietHours.start);
  const end = minutesOfDay(preferences.quietHours.end);
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function accountKey(userId: string): string {
  const clean = String(userId ?? '').trim().replace(/[^a-z0-9_-]/gi, '_');
  if (!clean) throw new Error('Notification preferences require an account id.');
  return `notification-prefs:${clean}`;
}

export function createNotificationPreferenceStore(storage: KeyValueStorage | null | undefined) {
  const store = createVersionedJsonStore(storage, 'biblequest.v6');
  return Object.freeze({
    load(userId: string): NotificationPreferences {
      const result = store.read<NotificationPreferences>(accountKey(userId), VERSION);
      return result.ok ? normalizeNotificationPreferences(result.value) : defaultNotificationPreferences();
    },
    save(userId: string, preferences: NotificationPreferences): NotificationPreferences {
      const normalized = normalizeNotificationPreferences(preferences);
      store.write(accountKey(userId), VERSION, normalized);
      return normalized;
    },
    clear(userId: string): boolean {
      return store.remove(accountKey(userId));
    },
  });
}

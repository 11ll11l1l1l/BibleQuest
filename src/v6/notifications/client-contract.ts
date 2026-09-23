import {
  NOTIFICATION_CATEGORIES,
  createNotificationPreferenceStore,
  defaultNotificationPreferences,
  normalizeNotificationPreferences,
  type NotificationCategory,
  type NotificationPreferences,
} from './preferences.ts';
import { isV6DeepLinkRoute, type V6DeepLinkRoute } from '../routing/deep-link.ts';
import type { KeyValueStorage } from '../platform/persistence.ts';

export const NOTIFICATION_CATEGORY_DESTINATIONS = Object.freeze({
  reading: 'my-journey',
  assignments: 'assignments',
  ministry: 'ministry-hub',
  announcements: 'notification-center',
  encouragement: 'notification-center',
  streaks: 'my-journey',
} satisfies Readonly<Record<NotificationCategory, V6DeepLinkRoute>>);

export const NOTIFICATION_SETTINGS_TEXT = Object.freeze({
  en: Object.freeze({
    title: 'Notification settings',
    master: 'Allow notifications',
    quietHours: 'Quiet hours',
    quietHoursHelp: 'Pause non-urgent notifications during these hours.',
    categoriesLabel: 'Notification categories',
    start: 'Start',
    end: 'End',
    categories: Object.freeze({
      reading: 'Bible reading', assignments: 'Assignments', ministry: 'Ministry',
      announcements: 'Announcements', encouragement: 'Encouragement', streaks: 'Streaks',
    }),
  }),
  tl: Object.freeze({
    title: 'Mga setting ng notification',
    master: 'Payagan ang mga notification',
    quietHours: 'Tahimik na oras',
    quietHoursHelp: 'I-pause ang mga hindi agarang notification sa mga oras na ito.',
    categoriesLabel: 'Mga uri ng notification',
    start: 'Simula',
    end: 'Wakas',
    categories: Object.freeze({
      reading: 'Pagbabasa ng Biblia', assignments: 'Mga assignment', ministry: 'Ministry',
      announcements: 'Mga anunsyo', encouragement: 'Pagpapalakas-loob', streaks: 'Mga streak',
    }),
  }),
  ceb: Object.freeze({
    title: 'Mga setting sa pahibalo',
    master: 'Tugoti ang mga pahibalo',
    quietHours: 'Hilom nga oras',
    quietHoursHelp: 'Hunonga una ang dili dinalian nga mga pahibalo niining mga orasa.',
    categoriesLabel: 'Mga klase sa pahibalo',
    start: 'Pagsugod',
    end: 'Katapusan',
    categories: Object.freeze({
      reading: 'Pagbasa sa Biblia', assignments: 'Mga buluhaton', ministry: 'Ministeryo',
      announcements: 'Mga pahibalo', encouragement: 'Pagdasig', streaks: 'Mga streak',
    }),
  }),
} as const);

export type NotificationSettingsLocale = keyof typeof NOTIFICATION_SETTINGS_TEXT;

export interface NotificationSettingsModel {
  readonly preferences: NotificationPreferences;
  readonly text: (typeof NOTIFICATION_SETTINGS_TEXT)[NotificationSettingsLocale];
  readonly categoryRows: readonly {
    readonly category: NotificationCategory;
    readonly label: string;
    readonly enabled: boolean;
    readonly destination: V6DeepLinkRoute;
  }[];
}

export function notificationDestination(category: NotificationCategory): V6DeepLinkRoute {
  const route = NOTIFICATION_CATEGORY_DESTINATIONS[category];
  if (!isV6DeepLinkRoute(route)) throw new Error('Notification category has an unsupported destination.');
  return route;
}

export function createNotificationSettingsModel(
  preferences: NotificationPreferences,
  locale: NotificationSettingsLocale = 'en',
): NotificationSettingsModel {
  const normalized = normalizeNotificationPreferences(preferences);
  const text = NOTIFICATION_SETTINGS_TEXT[locale] ?? NOTIFICATION_SETTINGS_TEXT.en;
  return Object.freeze({
    preferences: normalized,
    text,
    categoryRows: Object.freeze(NOTIFICATION_CATEGORIES.map((category) => Object.freeze({
      category,
      label: text.categories[category],
      enabled: normalized.categories[category],
      destination: notificationDestination(category),
    }))),
  });
}

export function createNotificationClientContext(storage: KeyValueStorage | null | undefined) {
  const store = createNotificationPreferenceStore(storage);
  let activeUserId: string | null = null;

  return Object.freeze({
    activate(userId: string): NotificationPreferences {
      const clean = String(userId ?? '').trim();
      if (!clean) throw new Error('Notification client context requires an account id.');
      activeUserId = clean;
      return store.load(clean);
    },
    preferences(): NotificationPreferences {
      return activeUserId ? store.load(activeUserId) : defaultNotificationPreferences();
    },
    save(preferences: NotificationPreferences): NotificationPreferences {
      if (!activeUserId) throw new Error('Cannot save notification preferences without an active account.');
      return store.save(activeUserId, preferences);
    },
    signOut(): void {
      if (activeUserId) store.clear(activeUserId);
      activeUserId = null;
    },
    switchAccount(nextUserId: string): NotificationPreferences {
      if (activeUserId) store.clear(activeUserId);
      return this.activate(nextUserId);
    },
  });
}

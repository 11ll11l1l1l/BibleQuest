import {
  createNotificationClientContext,
  createNotificationSettingsModel,
  type NotificationSettingsLocale,
  type NotificationSettingsModel,
} from './client-contract.ts';
import {
  normalizeNotificationPreferences,
  type NotificationCategory,
  type NotificationPreferences,
} from './preferences.ts';
import type { KeyValueStorage } from '../platform/persistence.ts';

export interface NotificationSettingsControl {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly ariaLabel: string;
  readonly destination?: string;
}

export interface NotificationSettingsSurface {
  readonly title: string;
  readonly categoriesLabel: string;
  readonly master: NotificationSettingsControl;
  readonly categories: readonly NotificationSettingsControl[];
  readonly quietHours: Readonly<{
    enabled: boolean;
    start: string;
    end: string;
    label: string;
    description: string;
    startLabel: string;
    endLabel: string;
    disabled: boolean;
  }>;
}

function control(id: string, label: string, checked: boolean, disabled: boolean, destination?: string): NotificationSettingsControl {
  return Object.freeze({ id, label, checked, disabled, ariaLabel: label, ...(destination ? { destination } : {}) });
}

export function createNotificationSettingsSurface(model: NotificationSettingsModel): NotificationSettingsSurface {
  const disabled = !model.preferences.masterEnabled;
  return Object.freeze({
    title: model.text.title,
    categoriesLabel: model.text.categoriesLabel,
    master: control('notification-master', model.text.master, model.preferences.masterEnabled, false),
    categories: Object.freeze(model.categoryRows.map((row) => control(
      `notification-category-${row.category}`,
      row.label,
      row.enabled,
      disabled,
      row.destination,
    ))),
    quietHours: Object.freeze({
      enabled: model.preferences.quietHours.enabled,
      start: model.preferences.quietHours.start,
      end: model.preferences.quietHours.end,
      label: model.text.quietHours,
      description: model.text.quietHoursHelp,
      startLabel: model.text.start,
      endLabel: model.text.end,
      disabled,
    }),
  });
}

export function createNotificationSettingsController(storage: KeyValueStorage | null | undefined) {
  const client = createNotificationClientContext(storage);
  let locale: NotificationSettingsLocale = 'en';

  const current = (): NotificationPreferences => client.preferences();
  const save = (next: NotificationPreferences): NotificationPreferences => client.save(normalizeNotificationPreferences(next));
  const surface = (): NotificationSettingsSurface => createNotificationSettingsSurface(createNotificationSettingsModel(current(), locale));

  return Object.freeze({
    activate(userId: string, nextLocale: NotificationSettingsLocale = 'en'): NotificationSettingsSurface {
      locale = nextLocale;
      client.activate(userId);
      return surface();
    },
    setLocale(nextLocale: NotificationSettingsLocale): NotificationSettingsSurface {
      locale = nextLocale;
      return surface();
    },
    setMaster(enabled: boolean): NotificationSettingsSurface {
      save({ ...current(), masterEnabled: enabled });
      return surface();
    },
    setCategory(category: NotificationCategory, enabled: boolean): NotificationSettingsSurface {
      const previous = current();
      save({ ...previous, categories: { ...previous.categories, [category]: enabled } });
      return surface();
    },
    setQuietHours(enabled: boolean, start: string, end: string): NotificationSettingsSurface {
      save({ ...current(), quietHours: { enabled, start, end } });
      return surface();
    },
    surface,
    signOut(): void { client.signOut(); },
    switchAccount(userId: string, nextLocale: NotificationSettingsLocale = locale): NotificationSettingsSurface {
      locale = nextLocale;
      client.switchAccount(userId);
      return surface();
    },
  });
}

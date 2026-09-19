import type { NotificationSettingsSurface } from './settings-surface.ts';
import type { PlatformStatusViewModel } from '../platform/status-surface.ts';

export interface AccessibleFieldPresentation {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly ariaLabel: string;
  readonly describedBy?: string;
  readonly destination?: string;
}

export interface NotificationSettingsPresentation {
  readonly landmark: 'region';
  readonly ariaLabelledBy: 'notification-settings-title';
  readonly title: Readonly<{ id: 'notification-settings-title'; text: string }>;
  readonly master: AccessibleFieldPresentation;
  readonly categories: readonly AccessibleFieldPresentation[];
  readonly quietHours: Readonly<{
    id: 'notification-quiet-hours';
    enabled: boolean;
    disabled: boolean;
    label: string;
    description: string;
    descriptionId: 'notification-quiet-hours-help';
    start: string;
    end: string;
  }>;
}

export interface PlatformStatusPresentation {
  readonly connectivity: Readonly<{
    id: 'platform-connectivity-status';
    text: string;
    role: 'status';
    ariaLive: 'polite';
    online: boolean;
    changedAt: number;
  }>;
  readonly install: Readonly<{
    id: 'platform-install-status';
    text: string;
    actionLabel: string | null;
    actionable: boolean;
    instructionsRequired: boolean;
  }>;
}

export function presentNotificationSettings(surface: NotificationSettingsSurface): NotificationSettingsPresentation {
  return Object.freeze({
    landmark: 'region' as const,
    ariaLabelledBy: 'notification-settings-title' as const,
    title: Object.freeze({ id: 'notification-settings-title' as const, text: surface.title }),
    master: Object.freeze({ ...surface.master }),
    categories: Object.freeze(surface.categories.map((item) => Object.freeze({ ...item }))),
    quietHours: Object.freeze({
      id: 'notification-quiet-hours' as const,
      enabled: surface.quietHours.enabled,
      disabled: surface.quietHours.disabled,
      label: surface.quietHours.label,
      description: surface.quietHours.description,
      descriptionId: 'notification-quiet-hours-help' as const,
      start: surface.quietHours.start,
      end: surface.quietHours.end,
    }),
  });
}

export function presentPlatformStatus(status: PlatformStatusViewModel): PlatformStatusPresentation {
  return Object.freeze({
    connectivity: Object.freeze({
      id: 'platform-connectivity-status' as const,
      text: status.connectivity.label,
      role: status.connectivity.role,
      ariaLive: status.connectivity.ariaLive,
      online: status.connectivity.online,
      changedAt: status.connectivity.changedAt,
    }),
    install: Object.freeze({
      id: 'platform-install-status' as const,
      text: status.install.label,
      actionLabel: status.install.actionLabel,
      actionable: status.install.actionable,
      instructionsRequired: status.install.instructionsRequired,
    }),
  });
}

export function validateNotificationPresentation(model: NotificationSettingsPresentation): readonly string[] {
  const errors: string[] = [];
  const ids = [model.title.id, model.master.id, model.quietHours.id, model.quietHours.descriptionId, ...model.categories.map((item) => item.id)];
  if (new Set(ids).size !== ids.length) errors.push('notification settings control IDs must be unique');
  if (!model.title.text.trim()) errors.push('notification settings title is required');
  if (!model.master.ariaLabel.trim()) errors.push('notification master accessible label is required');
  for (const item of model.categories) {
    if (!item.ariaLabel.trim()) errors.push(`${item.id} accessible label is required`);
    if (!item.destination) errors.push(`${item.id} deep-link destination is required`);
  }
  if (!model.quietHours.label.trim() || !model.quietHours.description.trim()) errors.push('quiet-hours accessible copy is required');
  return Object.freeze(errors);
}

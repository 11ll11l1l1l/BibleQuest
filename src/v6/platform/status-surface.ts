import type { ClientCapabilities } from './capabilities.ts';
import type { ConnectivitySnapshot } from './connectivity.ts';
import { chooseInstallExperience, type InstallExperience } from './install-policy.ts';

export type PlatformStatusLocale = 'en' | 'tl' | 'ceb';

export interface PlatformStatusCopy {
  readonly online: string;
  readonly offline: string;
  readonly installed: string;
  readonly prompt: string;
  readonly iosA2hs: string;
  readonly manual: string;
  readonly unsupported: string;
  readonly installAction: string;
}

const COPY: Readonly<Record<PlatformStatusLocale, PlatformStatusCopy>> = Object.freeze({
  en: Object.freeze({
    online: 'Online',
    offline: 'Offline — saved content remains available',
    installed: 'BibleQuest is installed',
    prompt: 'Install BibleQuest',
    iosA2hs: 'Add BibleQuest to your Home Screen',
    manual: 'Install BibleQuest from your browser menu',
    unsupported: 'App installation is not available in this browser',
    installAction: 'Install app',
  }),
  tl: Object.freeze({
    online: 'Online',
    offline: 'Offline — magagamit pa rin ang naka-save na nilalaman',
    installed: 'Naka-install ang BibleQuest',
    prompt: 'I-install ang BibleQuest',
    iosA2hs: 'Idagdag ang BibleQuest sa Home Screen',
    manual: 'I-install ang BibleQuest mula sa menu ng browser',
    unsupported: 'Hindi available ang pag-install ng app sa browser na ito',
    installAction: 'I-install ang app',
  }),
  ceb: Object.freeze({
    online: 'Online',
    offline: 'Offline — magamit gihapon ang na-save nga sulod',
    installed: 'Naka-install ang BibleQuest',
    prompt: 'I-install ang BibleQuest',
    iosA2hs: 'Idugang ang BibleQuest sa Home Screen',
    manual: 'I-install ang BibleQuest gikan sa menu sa browser',
    unsupported: 'Dili available ang pag-install sa app niini nga browser',
    installAction: 'I-install ang app',
  }),
});

export interface PlatformStatusViewModel {
  readonly connectivity: {
    readonly online: boolean;
    readonly label: string;
    readonly role: 'status';
    readonly ariaLive: 'polite';
    readonly changedAt: number;
  };
  readonly install: {
    readonly experience: InstallExperience;
    readonly label: string;
    readonly actionLabel: string | null;
    readonly actionable: boolean;
    readonly instructionsRequired: boolean;
  };
}

export function platformStatusCopy(locale: PlatformStatusLocale): PlatformStatusCopy {
  return COPY[locale] ?? COPY.en;
}

export function createPlatformStatusViewModel(
  locale: PlatformStatusLocale,
  connectivity: ConnectivitySnapshot,
  capabilities: Pick<ClientCapabilities, 'standalone' | 'ios' | 'serviceWorker'>,
  promptAvailable: boolean,
): PlatformStatusViewModel {
  const copy = platformStatusCopy(locale);
  const experience = chooseInstallExperience(capabilities, promptAvailable);
  const labels: Record<InstallExperience, string> = {
    installed: copy.installed,
    prompt: copy.prompt,
    'ios-a2hs': copy.iosA2hs,
    manual: copy.manual,
    unsupported: copy.unsupported,
  };

  return Object.freeze({
    connectivity: Object.freeze({
      online: connectivity.online,
      label: connectivity.online ? copy.online : copy.offline,
      role: 'status' as const,
      ariaLive: 'polite' as const,
      changedAt: connectivity.changedAt,
    }),
    install: Object.freeze({
      experience,
      label: labels[experience],
      actionLabel: experience === 'prompt' ? copy.installAction : null,
      actionable: experience === 'prompt',
      instructionsRequired: experience === 'ios-a2hs' || experience === 'manual',
    }),
  });
}

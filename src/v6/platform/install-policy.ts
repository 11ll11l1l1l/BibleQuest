import type { ClientCapabilities } from './capabilities.ts';

export type InstallExperience = 'installed' | 'prompt' | 'ios-a2hs' | 'manual' | 'unsupported';

export function chooseInstallExperience(
  capabilities: Pick<ClientCapabilities, 'standalone' | 'ios' | 'serviceWorker'>,
  promptAvailable: boolean,
): InstallExperience {
  if (capabilities.standalone) return 'installed';
  if (promptAvailable) return 'prompt';
  if (capabilities.ios && capabilities.serviceWorker) return 'ios-a2hs';
  if (capabilities.serviceWorker) return 'manual';
  return 'unsupported';
}

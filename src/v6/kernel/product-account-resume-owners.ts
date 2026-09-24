import type { AccountResumeOwner } from './account-resume-coordinator.ts';

export const PRODUCT_ACCOUNT_RESUME_KEYS = Object.freeze([
  'general',
  'bible-quest',
  'weekly-journey',
  'personal-challenges',
  'explorer',
  'leaderboard-delivery',
] as const);

export type ProductAccountResumeKey = (typeof PRODUCT_ACCOUNT_RESUME_KEYS)[number];

export type ProductAccountResumeServices = Readonly<Record<ProductAccountResumeKey, Omit<AccountResumeOwner, 'key'>>>;

/**
 * Defines the complete account-backed product owner set used by the live app.
 * Keeping this list typed and centralized prevents a bootstrap cutover from
 * silently omitting Journey/progress slices or changing their durable keys.
 */
export function createProductAccountResumeOwners(
  services: ProductAccountResumeServices,
): readonly AccountResumeOwner[] {
  return Object.freeze(
    PRODUCT_ACCOUNT_RESUME_KEYS.map((key) => {
      const service = services[key];
      if (!service || typeof service.syncNow !== 'function') {
        throw new Error(`Missing account resume service: ${key}`);
      }
      return Object.freeze({ key, syncNow: service.syncNow.bind(service), switchToGuest: service.switchToGuest?.bind(service) });
    }),
  );
}

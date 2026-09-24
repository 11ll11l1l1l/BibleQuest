import {
  translationPackagingPolicy,
  type TranslationPackagingPolicy,
} from './license-policy.ts';

export type OfflineScriptureEligibilityReason =
  | 'package-eligible'
  | 'live-only'
  | 'external-only'
  | 'redistribution-not-approved'
  | 'unknown-translation';

export type OfflineScriptureEligibility = Readonly<{
  translationId: string;
  eligible: boolean;
  delivery: TranslationPackagingPolicy['delivery'] | 'unknown';
  redistribution: TranslationPackagingPolicy['license']['redistribution'] | 'unknown';
  reason: OfflineScriptureEligibilityReason;
}>;

export function offlineScriptureEligibility(translationId: string): OfflineScriptureEligibility {
  const id = String(translationId ?? '').trim();
  const policy = translationPackagingPolicy(id);

  if (!policy) {
    return Object.freeze({
      translationId: id,
      eligible: false,
      delivery: 'unknown',
      redistribution: 'unknown',
      reason: 'unknown-translation',
    });
  }

  const packaged = policy.delivery === 'bundled' || policy.delivery === 'downloadable';
  if (packaged && policy.license.redistribution === 'allowed') {
    return Object.freeze({
      translationId: policy.translationId,
      eligible: true,
      delivery: policy.delivery,
      redistribution: policy.license.redistribution,
      reason: 'package-eligible',
    });
  }

  if (policy.delivery === 'live') {
    return Object.freeze({
      translationId: policy.translationId,
      eligible: false,
      delivery: policy.delivery,
      redistribution: policy.license.redistribution,
      reason: 'live-only',
    });
  }

  if (policy.delivery === 'external') {
    return Object.freeze({
      translationId: policy.translationId,
      eligible: false,
      delivery: policy.delivery,
      redistribution: policy.license.redistribution,
      reason: 'external-only',
    });
  }

  return Object.freeze({
    translationId: policy.translationId,
    eligible: false,
    delivery: policy.delivery,
    redistribution: policy.license.redistribution,
    reason: 'redistribution-not-approved',
  });
}

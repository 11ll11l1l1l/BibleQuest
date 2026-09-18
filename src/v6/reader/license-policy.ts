import type { ContentDelivery, ScriptureLicenseMetadata } from './content-manifest.ts';

export interface TranslationPackagingPolicy {
  readonly translationId: 'bsb' | 'tl' | 'cebocb' | 'jko' | 'nlt';
  readonly delivery: ContentDelivery;
  readonly license: ScriptureLicenseMetadata;
}

export const V6_TRANSLATION_PACKAGING_POLICY: readonly TranslationPackagingPolicy[] = Object.freeze([
  Object.freeze({
    translationId: 'bsb',
    delivery: 'downloadable',
    license: Object.freeze({
      source: 'Berean Standard Bible',
      license: 'Public-domain / CC0 browser source',
      attribution: 'See data/packs/ATTRIBUTION.md',
      redistribution: 'allowed',
    }),
  }),
  Object.freeze({
    translationId: 'tl',
    delivery: 'downloadable',
    license: Object.freeze({
      source: 'Tagalog Unlocked Literal Bible',
      license: 'CC BY-SA 4.0',
      attribution: '© 2018 Door43 World Missions Community',
      redistribution: 'allowed',
    }),
  }),
  Object.freeze({
    translationId: 'cebocb',
    delivery: 'downloadable',
    license: Object.freeze({
      source: 'Biblica Open Cebuano Contemporary Bible 2024',
      license: 'CC BY-SA 4.0',
      attribution: '© 2009, 2010, 2014, 2024 Biblica, Inc. · See data/packs/ATTRIBUTION.md',
      redistribution: 'allowed',
    }),
  }),
  Object.freeze({
    translationId: 'jko',
    delivery: 'live',
    license: Object.freeze({
      source: '口語訳聖書 (1954/1955) · GetBible japkougo',
      license: '1955 edition term expired; corrected wording requires source-specific review',
      attribution: 'GetBible/CrossWire japkougo source',
      redistribution: 'review-required',
    }),
  }),
  Object.freeze({
    translationId: 'nlt',
    delivery: 'external',
    license: Object.freeze({
      source: 'New Living Translation',
      license: 'Copyrighted translation · licensed external reader only',
      attribution: 'Tyndale House Publishers',
      redistribution: 'forbidden',
    }),
  }),
]);

export function translationPackagingPolicy(translationId: string): TranslationPackagingPolicy | null {
  return V6_TRANSLATION_PACKAGING_POLICY.find((item) => item.translationId === translationId) ?? null;
}

export const V6_PRIMARY_NAVIGATION = Object.freeze([
  'home',
  'learn',
  'play',
  'grow',
  'more',
] as const);

export type V6PrimaryNavigationId = typeof V6_PRIMARY_NAVIGATION[number];

export const V6_SECTION_ACCENTS = Object.freeze({
  home: '--bq-accent-home',
  learn: '--bq-accent-learn',
  play: '--bq-accent-play',
  grow: '--bq-accent-grow',
  ministry: '--bq-accent-ministry',
} as const);

export const V6_UI_PRIMITIVES = Object.freeze({
  pageHeader: 'bq-v6-page-header',
  section: 'bq-v6-section',
  sectionHeader: 'bq-v6-section-header',
  hero: 'bq-v6-hero',
  navigationRow: 'bq-v6-nav-row',
  navigationRowMeta: 'bq-v6-nav-row__meta',
  segmented: 'bq-v6-segmented',
  inlineNotice: 'bq-v6-inline-notice',
  skeleton: 'bq-v6-skeleton',
} as const);

export const V6_DESIGN_TOKENS = Object.freeze({
  surface: Object.freeze([
    '--bq-bg',
    '--bq-surface',
    '--bq-surface-muted',
    '--bq-surface-strong',
  ]),
  text: Object.freeze([
    '--bq-text',
    '--bq-text-secondary',
    '--bq-text-muted',
  ]),
  brand: Object.freeze([
    '--bq-brand',
    '--bq-brand-hover',
    '--bq-brand-soft',
  ]),
  spacing: Object.freeze([
    '--bq-space-1',
    '--bq-space-2',
    '--bq-space-3',
    '--bq-space-4',
    '--bq-space-6',
    '--bq-space-8',
    '--bq-space-12',
  ]),
  shape: Object.freeze([
    '--bq-radius-control',
    '--bq-radius-surface',
    '--bq-radius-hero',
    '--bq-radius-pill',
  ]),
  motion: Object.freeze([
    '--bq-motion-fast',
    '--bq-motion-base',
    '--bq-ease',
  ]),
} as const);

export const V6_UI_FOUNDATION = Object.freeze({
  version: 1,
  primaryNavigation: V6_PRIMARY_NAVIGATION,
  sectionAccents: V6_SECTION_ACCENTS,
  primitives: V6_UI_PRIMITIVES,
  tokens: V6_DESIGN_TOKENS,
  minimumTouchTargetPx: 44,
  progressiveDisclosure: true,
  editorialTypography: 'scripture-and-editorial-only',
  backendBehaviorChanged: false,
} as const);

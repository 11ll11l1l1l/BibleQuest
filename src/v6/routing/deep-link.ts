export const V6_DEEP_LINK_ROUTES = Object.freeze([
  'home',
  'my-journey',
  'reader',
  'assignments',
  'calendar',
  'notification-center',
  'community',
  'ministry-hub',
] as const);

export type V6DeepLinkRoute = (typeof V6_DEEP_LINK_ROUTES)[number];

const ROUTES = new Set<string>(V6_DEEP_LINK_ROUTES);

export function isV6DeepLinkRoute(value: unknown): value is V6DeepLinkRoute {
  return ROUTES.has(String(value ?? '').trim());
}

export function routeHash(route: V6DeepLinkRoute): string {
  return '#/' + route;
}

export function routeUrl(route: V6DeepLinkRoute): string {
  return './' + routeHash(route);
}

export function parseRouteHash(hash: string): V6DeepLinkRoute | null {
  const normalized = String(hash ?? '')
    .replace(/^#\/?/, '')
    .split('?')[0]
    .split('/')[0]
    .trim();
  return isV6DeepLinkRoute(normalized) ? normalized : null;
}

export interface NotificationActionPayload {
  readonly route?: unknown;
}

export function notificationRoute(payload: NotificationActionPayload | null | undefined): V6DeepLinkRoute | null {
  const route = payload?.route;
  return isV6DeepLinkRoute(route) ? route : null;
}

export const V6_APP_SHORTCUTS = Object.freeze([
  Object.freeze({
    name: "Today's Journey",
    short_name: 'Journey',
    description: "Continue today's BibleQuest journey.",
    route: 'my-journey' as const,
  }),
  Object.freeze({
    name: 'Read Bible',
    short_name: 'Bible',
    description: 'Open the Bible reader.',
    route: 'reader' as const,
  }),
  Object.freeze({
    name: 'Assignments',
    short_name: 'Tasks',
    description: 'Open current BibleQuest assignments.',
    route: 'assignments' as const,
  }),
  Object.freeze({
    name: 'Calendar',
    short_name: 'Calendar',
    description: 'Open the BibleQuest calendar.',
    route: 'calendar' as const,
  }),
]);

export function manifestShortcuts() {
  return V6_APP_SHORTCUTS.map((item) =>
    Object.freeze({
      name: item.name,
      short_name: item.short_name,
      description: item.description,
      url: routeUrl(item.route),
    }),
  );
}

export type RouteKey = 'home' | 'reader' | 'games' | 'community' | 'more' | 'not-found';

export interface RouteSnapshot {
  readonly key: RouteKey;
  readonly requested: string;
  readonly href: string;
}

export interface RouteView {
  mount(container: HTMLElement, snapshot: RouteSnapshot): void | (() => void);
}

export type RouteLoader = () => Promise<{ readonly createView: () => RouteView }>;

export interface RouteDefinition {
  readonly key: Exclude<RouteKey, 'not-found'>;
  readonly label: string;
  readonly load: RouteLoader;
}

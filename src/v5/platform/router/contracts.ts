import type { SessionService } from '../session/contracts';

export type RouteKey = 'home' | 'reader' | 'games' | 'community' | 'more' | 'account' | 'not-found';

export interface RouteSnapshot {
  readonly key: RouteKey;
  readonly requested: string;
  readonly href: string;
}

export interface RouteContext {
  readonly session: SessionService;
}

export interface RouteView {
  mount(container: HTMLElement, snapshot: RouteSnapshot): void | (() => void);
}

export type RouteLoader = () => Promise<{ readonly createView: (context: RouteContext) => RouteView }>;

export interface RouteDefinition {
  readonly key: Exclude<RouteKey, 'not-found'>;
  readonly label: string;
  readonly load: RouteLoader;
}

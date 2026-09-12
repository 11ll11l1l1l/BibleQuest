import type { RouteView } from '../../platform/router/contracts';

export function createView(): RouteView {
  return {
    mount(container, snapshot) {
      const section = document.createElement('section');
      section.className = 'v5-card';
      const heading = document.createElement('h2');
      heading.textContent = 'Page not found';
      const body = document.createElement('p');
      body.textContent = `No V5 route is registered for “${snapshot.requested}”.`;
      section.append(heading, body);
      container.replaceChildren(section);
    }
  };
}

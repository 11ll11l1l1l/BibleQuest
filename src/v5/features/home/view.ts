import type { RouteView } from '../../platform/router/contracts';

export function createView(): RouteView {
  return {
    mount(container) {
      const section = document.createElement('section');
      section.className = 'v5-card v5-home';

      const eyebrow = document.createElement('p');
      eyebrow.className = 'v5-eyebrow';
      eyebrow.textContent = 'Greenfield architecture proof';

      const heading = document.createElement('h2');
      heading.textContent = 'A smaller owner graph, built for V5';

      const body = document.createElement('p');
      body.textContent = 'This lab route proves typed navigation, lazy route loading and isolated feature ownership without replacing the production BibleQuest runtime.';

      section.append(eyebrow, heading, body);
      container.replaceChildren(section);
    }
  };
}

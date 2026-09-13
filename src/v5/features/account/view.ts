import type { RouteView } from '../../platform/router/contracts';
import type { SessionService, SessionSnapshot } from '../../platform/session/contracts';

function describe(snapshot: SessionSnapshot): { title: string; body: string } {
  if (snapshot.status === 'booting') return { title: 'Checking your account…', body: 'BibleQuest is restoring your session.' };
  if (snapshot.status === 'authenticated' && snapshot.user) {
    return {
      title: snapshot.user.displayName || snapshot.user.email || 'Signed in',
      body: 'Your identity is available to the app. Server authorization and congregation permissions remain authoritative.'
    };
  }
  if (snapshot.status === 'unavailable') return {
    title: 'Account service unavailable',
    body: snapshot.error || 'This experimental build cannot reach the account service.'
  };
  return { title: 'Not signed in', body: 'Sign-in controls are intentionally not migrated in this slice yet.' };
}

export function createView(session: SessionService): RouteView {
  return {
    mount(container) {
      const section = document.createElement('section');
      section.className = 'v5-card';
      const eyebrow = document.createElement('p');
      eyebrow.textContent = 'Account';
      const heading = document.createElement('h2');
      const body = document.createElement('p');
      const state = document.createElement('p');
      state.setAttribute('role', 'status');
      state.setAttribute('aria-live', 'polite');
      section.append(eyebrow, heading, body, state);
      container.replaceChildren(section);

      const render = (snapshot: SessionSnapshot) => {
        const copy = describe(snapshot);
        heading.textContent = copy.title;
        body.textContent = copy.body;
        state.textContent = `Session state: ${snapshot.status}`;
      };

      const unsubscribe = session.subscribe(render);
      return unsubscribe;
    }
  };
}

import type { RouteContext, RouteView } from '../../platform/router/contracts';
import type { AssignmentSummary } from '../../data/assignments/contracts';

const formatDue = (value: string | null) => {
  if (!value) return 'No deadline';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Deadline unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

const messageCard = (title: string, body: string, role?: 'status' | 'alert') => {
  const section = document.createElement('section');
  section.className = 'v5-card';
  if (role) section.setAttribute('role', role);
  const heading = document.createElement('h2');
  heading.textContent = title;
  const copy = document.createElement('p');
  copy.textContent = body;
  section.append(heading, copy);
  return section;
};

const assignmentCard = (assignment: AssignmentSummary) => {
  const article = document.createElement('article');
  article.className = 'v5-card';
  const title = document.createElement('h3');
  title.textContent = assignment.title;
  const meta = document.createElement('p');
  meta.textContent = `${assignment.type} · ${assignment.progressStatus} · ${assignment.dueState} · ${formatDue(assignment.dueAt)}`;
  article.append(title, meta);
  return article;
};

export const createView = (context: RouteContext): RouteView => ({
  mount(container) {
    let disposed = false;
    let requestVersion = 0;

    const render = async () => {
      const version = ++requestVersion;
      const session = context.session.getSnapshot();
      const congregation = context.congregation.getSnapshot();

      if (!session.remoteAvailable) {
        container.replaceChildren(messageCard('Assignments unavailable', 'Remote account services are unavailable, so protected assignments are not loaded.', 'status'));
        return;
      }
      if (!session.authenticated || !session.user) {
        container.replaceChildren(messageCard('Sign in to view assignments', 'Assignments are protected congregation data and are not requested for signed-out users.'));
        return;
      }
      if (congregation.status !== 'selected' || !congregation.active) {
        const detail = congregation.status === 'unavailable'
          ? 'Congregation context is not connected in this lab build, so no protected assignment request was made.'
          : 'Choose an active congregation before loading assignments.';
        container.replaceChildren(messageCard('Select a congregation', detail, 'status'));
        return;
      }

      container.replaceChildren(messageCard('Loading assignments', 'Loading assignments for the active congregation…', 'status'));
      try {
        const assignments = await context.assignments.listVisible({
          userId: session.user.id,
          congregationId: congregation.active.id
        });
        if (disposed || version !== requestVersion) return;

        const section = document.createElement('section');
        section.className = 'v5-stack';
        const heading = document.createElement('h2');
        heading.textContent = 'Assignments';
        const scope = document.createElement('p');
        scope.textContent = congregation.active.name;
        section.append(heading, scope);
        if (!assignments.length) {
          const empty = document.createElement('p');
          empty.textContent = 'No active assignments are visible for this account in the selected congregation.';
          section.append(empty);
        } else {
          for (const assignment of assignments) section.append(assignmentCard(assignment));
        }
        container.replaceChildren(section);
      } catch {
        if (disposed || version !== requestVersion) return;
        container.replaceChildren(messageCard('Assignments could not load', 'Protected assignment data is unavailable. No authorization fallback or local substitute was used.', 'alert'));
      }
    };

    const stopSession = context.session.subscribe(() => void render());
    const stopCongregation = context.congregation.subscribe(() => void render());
    void render();

    return () => {
      disposed = true;
      requestVersion += 1;
      stopSession();
      stopCongregation();
    };
  }
});

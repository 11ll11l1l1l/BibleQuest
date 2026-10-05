import { createCurriculumAuthoringFeature } from '../features/curriculum-authoring/feature.js';
import { createAssignmentPreparation } from '../features/curriculum-authoring/assignment-preparation.js';
import { assignmentPreparationPage } from '../features/curriculum-authoring/assignment-page.js';
import { createV7AssignmentAuthority } from './v7-assignment-authority.js';

export function v7AuthoringContext(session, membership) {
  const auth = session.getState(), active = membership.getActive();
  const userId = auth?.authenticated ? auth.user?.id : null;
  const ownsScope = Boolean(userId && active?.congregationId && (!active.userId || active.userId === userId));
  return Object.freeze({ userId: ownsScope ? userId : null,
    congregationId: ownsScope ? active.congregationId : null,
    canAuthor: ownsScope && ['leader', 'pastor', 'admin'].includes(active.role) });
}

// Loaded only for an explicit workspace entry. Shared session and congregation
// owners remain authoritative; feature pages dispose their local controllers.
export function createV7WorkspacePage({ view, client, session, membership, service, ...navigation }) {
  if (view === 'authoring') {
    const feature = createCurriculumAuthoringFeature({ client,
      getContext: () => v7AuthoringContext(session, membership) });
    return feature.createPage(navigation);
  }
  if (view === 'assignment') {
    const preparation = createAssignmentPreparation({ discipleship: service,
      getActorId: () => session.getState()?.authenticated ? session.getState().user?.id : null });
    const authority = createV7AssignmentAuthority({ client, session, membership });
    return assignmentPreparationPage({ preparation, createAssignment: authority.createAssignment, ...navigation });
  }
  throw new TypeError('Unknown ONE 2 ONE workspace.');
}

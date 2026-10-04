import { createTrackAuthoringRepository } from './tracks.js';
import { createHierarchyAuthoringRepository } from './hierarchy.js';
import { createLessonRevisionAuthoringRepository } from './lesson-revisions.js';
import { createPublicationReadinessRepository } from './publication-readiness.js';
import { createCurriculumAuthoringController } from './controller.js';
import { preparePublicationRequest } from './publication-request.js';
import { createCurriculumPublicationAuthority } from './publication-authority.js';
import { createWithdrawalPreparationRepository } from './withdrawal-preparation.js';

// Feature-local dependency composition only. The caller remains the owner of the
// authenticated client, active account/congregation context, routing, and lifecycle.
export function createCurriculumAuthoringFeature({ client, getContext, newRevisionId } = {}) {
  if (!client) throw new TypeError('Curriculum authoring requires an authenticated database client or client provider.');
  if (typeof getContext !== 'function') throw new TypeError('Curriculum authoring requires the existing account/congregation context owner.');

  const tracks = createTrackAuthoringRepository({ client, getContext, newRevisionId });
  const hierarchy = createHierarchyAuthoringRepository({ client, getContext, newRevisionId });
  const revisions = createLessonRevisionAuthoringRepository({ client, getContext });
  const readiness = createPublicationReadinessRepository({ client, getContext });
  const withdrawal = createWithdrawalPreparationRepository({ client, getContext });
  const repositories = Object.freeze({ tracks, hierarchy, revisions, readiness, withdrawal });
  const controller = createCurriculumAuthoringController(repositories);
  const preparePublication = () => preparePublicationRequest(controller.getState());
  const prepareWithdrawal = (trackId, moduleId, lessonId) => withdrawal.prepare(trackId, moduleId, lessonId);
  const publication = createCurriculumPublicationAuthority({ client, getContext });

  return Object.freeze({ controller, repositories, preparePublication, prepareWithdrawal, publication });
}

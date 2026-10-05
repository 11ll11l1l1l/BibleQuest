import { createLessonRunner } from './controller.js';
import { createLessonRunnerPage } from './page.js';
export function lessonRoutePage({service,session,membership,pairId,revisionId,stepId,...navigation}) {
  // Missing identities flow through the existing visible load error, never a default lesson.
  const runner=createLessonRunner({service,session,membership,pairId:pairId||'missing',revisionId:revisionId||'missing',resumeStepId:stepId||null});
  return createLessonRunnerPage({runner,...navigation});
}

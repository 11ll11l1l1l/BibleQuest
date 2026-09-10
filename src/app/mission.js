// #83 Personal Mission lifecycle owner. Reuses Open Review's overview()
// getter (due count, weakest category) instead of tracking its own review
// schedule or mastery data. No storage, no direct DOM/network access.
import { recommend } from '../engines/mission.js';

export function createMissionService({ openReview }) {
  if (!openReview?.overview) throw new Error('Personal Mission requires the Open Review owner.');
  return Object.freeze({
    recommend() {
      const overview = openReview.overview();
      return recommend({ due: overview.due, weakest: overview.weakest });
    }
  });
}

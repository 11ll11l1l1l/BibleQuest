declare const __BQ_BUILD_SHA__: string;

export interface BibleQuestBuildIdentity {
  readonly sha: string;
  readonly development: boolean;
}

export function getBibleQuestBuildIdentity(): BibleQuestBuildIdentity {
  const sha =
    typeof __BQ_BUILD_SHA__ === 'string' && __BQ_BUILD_SHA__.trim()
      ? __BQ_BUILD_SHA__.trim()
      : 'development';

  return Object.freeze({
    sha,
    development: sha === 'development',
  });
}

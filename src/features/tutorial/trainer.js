export const TRAINER_STATES = Object.freeze(['welcome', 'right', 'left', 'up', 'down', 'thumbs', 'surprise', 'thoughtful']);
export const TUTORIAL_STEP_TRAINER_STATES = Object.freeze(['welcome', 'down', 'right', 'up', 'thoughtful', 'left', 'thumbs', 'surprise', 'thumbs']);

export function trainerStateForStep(step) {
  const index = Number.isInteger(step) ? step : 0;
  return TUTORIAL_STEP_TRAINER_STATES[index] || 'welcome';
}

export function trainerStateClass(step) {
  return `bq-tutorial-trainer-${trainerStateForStep(step)}`;
}

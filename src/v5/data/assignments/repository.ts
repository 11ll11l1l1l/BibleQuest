import type { AssignmentsRepository } from './contracts';

export class AssignmentsUnavailableError extends Error {
  readonly code = 'BQ_V5_ASSIGNMENTS_UNAVAILABLE';

  constructor(message = 'Assignments data is not connected in the greenfield lab yet.') {
    super(message);
    this.name = 'AssignmentsUnavailableError';
  }
}

export function createUnavailableAssignmentsRepository(): AssignmentsRepository {
  return Object.freeze({
    async listVisible() {
      throw new AssignmentsUnavailableError();
    }
  });
}

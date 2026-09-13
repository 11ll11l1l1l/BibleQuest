import type {
  AssignmentDueState,
  AssignmentProgressStatus,
  AssignmentSummary,
  AssignmentsRepository,
  ListVisibleAssignmentsInput
} from './contracts';

const ASSIGNMENT_TYPES = new Set([
  'reading',
  'guided-study',
  'mission',
  'quiz',
  'reflection',
  'couples',
  'group',
  'custom'
]);
const PROGRESS_STATUSES = new Set<AssignmentProgressStatus>(['assigned', 'started', 'completed']);

export interface AssignmentReadRow {
  readonly id: unknown;
  readonly congregation_id: unknown;
  readonly title: unknown;
  readonly assignment_type: unknown;
  readonly due_at: unknown;
  readonly schedule_at?: unknown;
  readonly active: unknown;
}

export interface AssignmentProgressReadRow {
  readonly assignment_id: unknown;
  readonly user_id: unknown;
  readonly status: unknown;
}

export interface AuthorizedAssignmentsReadPort {
  selectActiveAssignments(input: {
    readonly congregationId: string;
    readonly limit: 200;
  }): Promise<readonly AssignmentReadRow[]>;
  selectUserProgress(input: {
    readonly userId: string;
    readonly assignmentIds: readonly string[];
  }): Promise<readonly AssignmentProgressReadRow[]>;
}

export class AssignmentsResponseError extends Error {
  readonly code = 'BQ_V5_ASSIGNMENTS_RESPONSE';

  constructor(message: string) {
    super(message);
    this.name = 'AssignmentsResponseError';
  }
}

function requiredId(value: unknown, label: string): string {
  const id = String(value ?? '').trim();
  if (!id) throw new AssignmentsResponseError(`${label} was missing.`);
  return id;
}

function optionalIso(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw new AssignmentsResponseError(`${label} was invalid.`);
  return parsed.toISOString();
}

function normalizeAssignment(row: AssignmentReadRow, congregationId: string) {
  const id = requiredId(row.id, 'Assignment id');
  if (String(row.congregation_id ?? '') !== congregationId) {
    throw new AssignmentsResponseError('Assignment data was outside the active congregation.');
  }
  if (row.active !== true) throw new AssignmentsResponseError('Assignment data returned an inactive task.');

  const title = String(row.title ?? '').trim().slice(0, 120);
  if (title.length < 2) throw new AssignmentsResponseError('Assignment title was invalid.');

  const type = String(row.assignment_type ?? '');
  if (!ASSIGNMENT_TYPES.has(type)) throw new AssignmentsResponseError('Assignment type was unsupported.');

  return Object.freeze({
    id,
    congregationId,
    title,
    type,
    dueAt: optionalIso(row.due_at, 'Assignment deadline'),
    scheduleAt: optionalIso(row.schedule_at, 'Assignment schedule')
  });
}

function progressMapFor(
  rows: readonly AssignmentProgressReadRow[],
  userId: string,
  visibleIds: ReadonlySet<string>
): ReadonlyMap<string, AssignmentProgressStatus> {
  const progress = new Map<string, AssignmentProgressStatus>();
  for (const row of rows) {
    const assignmentId = String(row.assignment_id ?? '');
    const rowUserId = String(row.user_id ?? '');
    if (rowUserId !== userId || !visibleIds.has(assignmentId) || progress.has(assignmentId)) continue;
    const status = String(row.status ?? 'assigned') as AssignmentProgressStatus;
    if (!PROGRESS_STATUSES.has(status)) {
      throw new AssignmentsResponseError('Assignment progress status was unsupported.');
    }
    progress.set(assignmentId, status);
  }
  return progress;
}

function dueState(
  assignment: { readonly dueAt: string | null; readonly scheduleAt: string | null },
  status: AssignmentProgressStatus,
  nowMs: number
): AssignmentDueState {
  if (status === 'completed') return 'completed';
  if (assignment.scheduleAt && new Date(assignment.scheduleAt).getTime() > nowMs) return 'scheduled';
  if (assignment.dueAt && new Date(assignment.dueAt).getTime() < nowMs) return 'overdue';
  return 'open';
}

export function createAuthorizedAssignmentsRepository(input: {
  readonly port: AuthorizedAssignmentsReadPort;
  readonly now?: () => Date;
}): AssignmentsRepository {
  const { port, now = () => new Date() } = input;

  return Object.freeze({
    async listVisible(request: ListVisibleAssignmentsInput): Promise<readonly AssignmentSummary[]> {
      const userId = requiredId(request.userId, 'User id');
      const congregationId = requiredId(request.congregationId, 'Congregation id');

      const rawAssignments = await port.selectActiveAssignments({ congregationId, limit: 200 });
      const assignments = rawAssignments.map((row) => normalizeAssignment(row, congregationId));
      if (!assignments.length) return Object.freeze([]);

      const ids = Object.freeze(assignments.map((assignment) => assignment.id));
      const rawProgress = await port.selectUserProgress({ userId, assignmentIds: ids });
      const progress = progressMapFor(rawProgress, userId, new Set(ids));
      const nowValue = now();
      const nowMs = nowValue.getTime();
      if (Number.isNaN(nowMs)) throw new AssignmentsResponseError('Current time source was invalid.');

      return Object.freeze(assignments.map((assignment) => {
        const progressStatus = progress.get(assignment.id) ?? 'assigned';
        return Object.freeze<AssignmentSummary>({
          id: assignment.id,
          congregationId: assignment.congregationId,
          title: assignment.title,
          type: assignment.type,
          dueAt: assignment.dueAt,
          progressStatus,
          dueState: dueState(assignment, progressStatus, nowMs)
        });
      }));
    }
  });
}

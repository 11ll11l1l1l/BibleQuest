export type AssignmentProgressStatus = 'assigned' | 'started' | 'completed';
export type AssignmentDueState = 'open' | 'scheduled' | 'overdue' | 'completed';

export interface AssignmentSummary {
  readonly id: string;
  readonly congregationId: string;
  readonly title: string;
  readonly type: string;
  readonly dueAt: string | null;
  readonly progressStatus: AssignmentProgressStatus;
  readonly dueState: AssignmentDueState;
}

export interface ListVisibleAssignmentsInput {
  readonly userId: string;
  readonly congregationId: string;
}

export interface AssignmentsRepository {
  listVisible(input: ListVisibleAssignmentsInput): Promise<readonly AssignmentSummary[]>;
}

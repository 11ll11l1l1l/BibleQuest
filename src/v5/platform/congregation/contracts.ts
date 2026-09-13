export type CongregationContextStatus = 'unavailable' | 'none' | 'selected';

export interface ActiveCongregation {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

export interface CongregationContextSnapshot {
  readonly status: CongregationContextStatus;
  readonly active: ActiveCongregation | null;
  readonly error: string;
}

export interface CongregationContextService {
  getSnapshot(): CongregationContextSnapshot;
  subscribe(listener: (snapshot: CongregationContextSnapshot) => void): () => void;
}

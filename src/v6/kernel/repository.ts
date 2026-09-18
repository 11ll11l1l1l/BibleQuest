import type { TenantScope } from './tenant-context.ts';

export interface RepositoryRequest {
  readonly scope: TenantScope;
  readonly signal?: AbortSignal;
}

export interface ReadRepository<TQuery, TResult> {
  readonly read: (request: RepositoryRequest & Readonly<{ query: TQuery }>) => Promise<TResult>;
}

export interface WriteRepository<TCommand, TResult> {
  readonly write: (request: RepositoryRequest & Readonly<{ command: TCommand }>) => Promise<TResult>;
}

export interface TenantRepository<TQuery, TCommand, TReadResult, TWriteResult>
  extends ReadRepository<TQuery, TReadResult>,
    WriteRepository<TCommand, TWriteResult> {}

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createContentReportingService } from '../../src/app/content-reporting.js';
import { createContentModerationService } from '../../src/app/content-moderation.js';
import { createContentReviewService } from '../../src/app/content-review.js';
import { createTrustedScoreEventsService } from '../../src/app/trusted-score-events.js';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function mutableSession(initial = 'user-a') {
  let userId = initial;
  return {
    getState() {
      return userId
        ? { authenticated: true, remoteAvailable: true, user: { id: userId } }
        : { authenticated: false, remoteAvailable: true, user: null };
    },
    setUser(next: string) { userId = next; },
  };
}

function membership(userId: string, congregationId: string, role = 'leader') {
  return {
    congregationId,
    userId,
    role,
    roleKnown: true,
    roleLabel: role,
    congregation: { id: congregationId, name: `Church ${congregationId}` },
  };
}

describe('content and trusted-event account-switch isolation', () => {
  it('content reporting rejects a late membership result after the account changes', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    let writes = 0;
    const congregation = {
      async load() {
        started.resolve();
        await release.promise;
        return [membership('user-a', 'cong-a', 'member')];
      },
      get() { return membership('user-a', 'cong-a', 'member'); },
    };
    const service = createContentReportingService({
      session,
      congregation,
      api: { async submit() { writes++; return { id: 1 }; } },
    });

    const pending = service.prepare();
    await started.promise;
    session.setUser('user-b');
    release.resolve();
    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_CONTENT_REPORT_CONTEXT_STALE');
    assert.equal(writes, 0);
  });

  it('trusted score submission does not cross an account switch while loading scope', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    let submits = 0;
    const congregation = {
      can() { return false; },
      async load() {
        started.resolve();
        await release.promise;
        return [membership('user-a', 'cong-a')];
      },
    };
    const service = createTrustedScoreEventsService({
      session,
      congregation,
      api: { async submit() { submits++; return { processed: [] }; } },
    });

    const pending = service.submit('cong-a', [{ sourceEventId: 'evt-1', source: 'Guided Study' }]);
    await started.promise;
    session.setUser('user-b');
    release.resolve();
    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_SCORE_EVENT_CONTEXT_STALE');
    assert.equal(submits, 0);
  });

  it('content moderation keeps Account B policy when a late Account A policy returns', async () => {
    const session = mutableSession();
    const aListStarted = deferred();
    const releaseA = deferred();
    const congregation = {
      async load() {
        const userId = session.getState().user?.id || '';
        return [membership(userId, userId === 'user-a' ? 'cong-a' : 'cong-b')];
      },
    };
    const api = {
      async list(congregationId: string) {
        if (congregationId === 'cong-a') {
          aListStarted.resolve();
          await releaseA.promise;
          return [{
            congregation_id: 'cong-a',
            content_key: 'question:core:a',
            content_type: 'question',
            origin: 'review',
            decision: 'remove',
          }];
        }
        return [{
          congregation_id: 'cong-b',
          content_key: 'question:core:b',
          content_type: 'question',
          origin: 'review',
          decision: 'include',
        }];
      },
    };
    const service = createContentModerationService({ api, session, congregation });

    const stale = service.refresh();
    await aListStarted.promise;
    session.setUser('user-b');
    const fresh = await service.refresh();
    assert.equal(fresh.status, 'ready');
    assert.equal(fresh.congregationId, 'cong-b');
    assert.equal(service.decisionFor('question:core:b')?.decision, 'include');

    releaseA.resolve();
    await stale;
    assert.equal(service.snapshot().congregationId, 'cong-b');
    assert.equal(service.decisionFor('question:core:a'), null);
    assert.equal(service.decisionFor('question:core:b')?.decision, 'include');
  });

  it('content review keeps Account B queue when Account A resolves late', async () => {
    const session = mutableSession();
    const aQueueStarted = deferred();
    const releaseA = deferred();
    const congregation = {
      async load() {
        const userId = session.getState().user?.id || '';
        return [membership(userId, userId === 'user-a' ? 'cong-a' : 'cong-b')];
      },
    };
    const queueFor = (id: string) => ({
      decisions: [],
      reports: [{
        id: id === 'cong-a' ? 1 : 2,
        congregation_id: id,
        reporter_id: id === 'cong-a' ? 'reporter-a' : 'reporter-b',
        content_key: `v3:study:${id}`,
        content_type: 'question',
        content_source: 'v3-screen',
        content_ref: 'John 3:16',
        content_text: id,
        content_payload: {},
        reason: 'accuracy',
        note: '',
        status: 'open',
      }],
      members: [],
    });
    const api = {
      async platformAccess() { return null; },
      async listPlatformCongregations() { return []; },
      async loadQueue(id: string) {
        if (id === 'cong-a') {
          aQueueStarted.resolve();
          await releaseA.promise;
        }
        return queueFor(id);
      },
      async saveDecision(row: any) { return row; },
      async markReportsReviewed() { return []; },
    };
    const recall = {
      async loadManifest() { return { books: [] }; },
      async loadQuarantine() { return []; },
    };
    const service = createContentReviewService({ api, session, congregation, recall });

    const stale = service.refresh();
    await aQueueStarted.promise;
    session.setUser('user-b');
    const fresh = await service.refresh();
    assert.equal(fresh.status, 'ready');
    assert.equal(fresh.congregationId, 'cong-b');
    assert.equal(service.reportItems()[0]?.contentText, 'cong-b');

    releaseA.resolve();
    await stale;
    assert.equal(service.getState().congregationId, 'cong-b');
    assert.equal(service.reportItems()[0]?.contentText, 'cong-b');
  });

  it('content review blocks cached reviewer authority after an account switch', async () => {
    const session = mutableSession();
    let saves = 0;
    const congregation = {
      async load() { return [membership('user-a', 'cong-a')]; },
    };
    const api = {
      async platformAccess() { return null; },
      async listPlatformCongregations() { return []; },
      async loadQueue() {
        return {
          decisions: [],
          reports: [{
            id: 1,
            congregation_id: 'cong-a',
            reporter_id: 'reporter',
            content_key: 'v3:study:item',
            content_type: 'question',
            content_source: 'v3-screen',
            content_ref: 'John 3:16',
            content_text: 'Text',
            content_payload: {},
            reason: 'accuracy',
            note: '',
            status: 'open',
          }],
          members: [],
        };
      },
      async saveDecision(row: any) { saves++; return row; },
      async markReportsReviewed() { return []; },
    };
    const recall = {
      async loadManifest() { return { books: [] }; },
      async loadQuarantine() { return []; },
    };
    const service = createContentReviewService({ api, session, congregation, recall });
    assert.equal((await service.refresh()).status, 'ready');

    session.setUser('user-b');
    await assert.rejects(
      () => service.decide({ contentKey: 'v3:study:item', decision: 'remove' }),
      (error: any) => error?.code === 'BQ_CONTENT_REVIEW_CONTEXT_STALE',
    );
    assert.equal(saves, 0);
    assert.equal(service.reportItems().length, 0);
  });
});

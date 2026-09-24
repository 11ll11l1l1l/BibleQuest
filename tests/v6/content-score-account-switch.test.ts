import { describe, expect, it } from 'vitest';
import { createContentReportingService } from '../../src/app/content-reporting.js';
import { createContentModerationService } from '../../src/app/content-moderation.js';
import { createContentReviewService } from '../../src/app/content-review.js';
import { createTrustedScoreEventsService } from '../../src/app/trusted-score-events.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}

describe('V6 S3 content/score account-switch isolation', () => {
  it('rejects a report when membership loading crosses accounts', async () => {
    let userId = 'u1';
    const load = deferred<any[]>();
    const service = createContentReportingService({
      session: { getState: () => ({ authenticated: true, user: { id: userId } }) },
      congregation: { load: () => load.promise, get: () => ({ congregationId: 'c1', userId: 'u1' }) },
      api: { submit: async () => ({ id: 'r1' }) }
    });
    const pending = service.prepare();
    userId = 'u2';
    load.resolve([{ congregationId: 'c1', congregation: { name: 'One' }, role: 'member' }]);
    await expect(pending).rejects.toMatchObject({ code: 'BQ_CONTENT_REPORT_CONTEXT_STALE' });
  });

  it('does not expose late moderation policy to the next account', async () => {
    let userId = 'u1';
    const list = deferred<any[]>();
    const service = createContentModerationService({
      session: { getState: () => ({ authenticated: true, remoteAvailable: true, user: { id: userId } }) },
      congregation: { load: async () => [{ congregationId: 'c1', userId: 'u1', congregation: { name: 'One' } }] },
      api: { list: () => list.promise }
    });
    const pending = service.refresh();
    await Promise.resolve();
    userId = 'u2';
    list.resolve([{ congregation_id: 'c1', content_key: 'question:core:q1', content_type: 'question', origin: 'review', decision: 'remove' }]);
    await pending;
    expect(service.snapshot().decisionCount).toBe(0);
    expect(service.snapshot().congregationId).toBe('');
  });

  it('does not expose a late review queue to the next account', async () => {
    let userId = 'u1';
    const queue = deferred<any>();
    const service = createContentReviewService({
      session: { getState: () => ({ authenticated: true, user: { id: userId } }) },
      congregation: { load: async () => [{ congregationId: 'c1', userId: 'u1', role: 'leader', congregation: { name: 'One' } }] },
      api: {
        platformAccess: async () => null,
        listPlatformCongregations: async () => [],
        loadQueue: () => queue.promise,
        saveDecision: async (row: any) => row,
        markReportsReviewed: async () => []
      },
      recall: { loadManifest: async () => ({ books: [] }), loadQuarantine: async () => [] }
    });
    const pending = service.refresh();
    await Promise.resolve();
    userId = 'u2';
    queue.resolve({ decisions: [], reports: [], members: [] });
    await pending;
    expect(service.getState().congregationId).toBe('');
    expect(service.getState().status).not.toBe('ready');
  });

  it('rejects a trusted-score response after an account switch', async () => {
    let userId = 'u1';
    const submit = deferred<any>();
    const service = createTrustedScoreEventsService({
      session: { getState: () => ({ authenticated: true, remoteAvailable: true, user: { id: userId } }) },
      congregation: { load: async () => [], can: () => true },
      api: { submit: () => submit.promise }
    });
    const pending = service.submit('c1', [{ sourceEventId: 'evt-1', source: 'Guided Study' }]);
    userId = 'u2';
    submit.resolve({ processed: [{ sourceEventId: 'evt-1', accepted: true, points: 5 }] });
    await expect(pending).rejects.toMatchObject({ code: 'BQ_SCORE_EVENT_CONTEXT_STALE' });
  });
});

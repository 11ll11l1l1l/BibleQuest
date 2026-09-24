import assert from 'node:assert/strict';
import test from 'node:test';
import type { MediaPlayerInstance, MediaProviderAdapter, MediaSource } from '../../src/v6/media/contracts.ts';
import { createMediaProviderRegistry } from '../../src/v6/media/provider-registry.ts';
import { createMediaSessionManager } from '../../src/v6/media/session-manager.ts';

function mockProvider(log: string[]): MediaProviderAdapter {
  return {
    id: 'youtube',
    canHandle(source: MediaSource) { return source.provider === 'youtube' && /^[A-Za-z0-9_-]{6,20}$/.test(source.mediaId); },
    create({ instanceId, source }): MediaPlayerInstance {
      let status: any = 'ready';
      return {
        instanceId,
        source,
        getState: () => ({ instanceId, source, status, positionSeconds: 0, error: '' }),
        play() { log.push(`${instanceId}:play`); status = 'playing'; },
        pause() { log.push(`${instanceId}:pause`); status = 'paused'; },
        stop() { log.push(`${instanceId}:stop`); status = 'stopped'; },
        seek(seconds: number) { log.push(`${instanceId}:seek:${seconds}`); },
        destroy() { log.push(`${instanceId}:destroy`); status = 'destroyed'; },
      };
    },
  };
}

const source = (id: string): MediaSource => ({ provider: 'youtube', mediaId: id, title: `Video ${id}` });

test('media session manager registers multiple players but enforces one audible player', async () => {
  const log: string[] = [];
  const providers = createMediaProviderRegistry([mockProvider(log)]);
  const manager = createMediaSessionManager({ providers });

  await manager.open({ instanceId: 'one', source: source('abc12345'), host: {} });
  await manager.open({ instanceId: 'two', source: source('def67890'), host: {} });
  assert.equal(manager.getPlayerCount(), 2);

  await manager.play('one');
  assert.equal(manager.getState().activeInstanceId, 'one');
  await manager.play('two');
  assert.deepEqual(log.slice(-2), ['one:pause', 'two:play']);
  assert.equal(manager.getState().activeInstanceId, 'two');

  await manager.close('two');
  assert.equal(manager.getState().activeInstanceId, null);
  assert.equal(manager.getPlayerCount(), 1);
  await manager.closeAll();
  assert.equal(manager.getPlayerCount(), 0);
  assert.ok(log.includes('one:destroy'));
});

test('media session lifecycle fails closed for unknown instances and providers', async () => {
  const providers = createMediaProviderRegistry([mockProvider([])]);
  const manager = createMediaSessionManager({ providers });
  await assert.rejects(() => manager.play('missing'), /Unknown media instance/);
  assert.throws(
    () => providers.resolve({ provider: 'youtube', mediaId: '', title: 'x' }),
    /No media provider/,
  );
});

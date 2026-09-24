import type {
  MediaPlayerInstance,
  MediaPlayerState,
  MediaSource,
} from './contracts.ts';
import type { MediaProviderRegistry } from './provider-registry.ts';

export interface MediaSessionSnapshot {
  readonly activeInstanceId: string | null;
  readonly players: readonly MediaPlayerState[];
}

export function createMediaSessionManager({
  providers,
}: {
  readonly providers: MediaProviderRegistry;
}) {
  if (!providers?.resolve) throw new Error('Media session manager requires the provider registry.');

  const players = new Map<string, MediaPlayerInstance>();
  let activeInstanceId: string | null = null;

  const snapshot = (): MediaSessionSnapshot => Object.freeze({
    activeInstanceId,
    players: Object.freeze([...players.values()].map((player) => player.getState())),
  });

  const requirePlayer = (instanceId: string) => {
    const id = String(instanceId ?? '').trim();
    const player = players.get(id);
    if (!player) throw new Error(`Unknown media instance: ${id || 'missing'}.`);
    return player;
  };

  async function open(input: {
    readonly instanceId: string;
    readonly source: MediaSource;
    readonly host: unknown;
  }) {
    const instanceId = String(input?.instanceId ?? '').trim();
    if (!instanceId || instanceId.length > 100) throw new Error('Media instance id is invalid.');
    if (players.has(instanceId)) await close(instanceId);
    const provider = providers.resolve(input.source);
    const player = provider.create({ instanceId, source: input.source, host: input.host });
    players.set(instanceId, player);
    return player.getState();
  }

  async function play(instanceId: string) {
    const player = requirePlayer(instanceId);
    if (activeInstanceId && activeInstanceId !== player.instanceId) {
      await requirePlayer(activeInstanceId).pause();
    }
    await player.play();
    activeInstanceId = player.instanceId;
    return snapshot();
  }

  async function pause(instanceId: string) {
    const player = requirePlayer(instanceId);
    await player.pause();
    if (activeInstanceId === player.instanceId) activeInstanceId = null;
    return snapshot();
  }

  async function stop(instanceId: string) {
    const player = requirePlayer(instanceId);
    await player.stop();
    if (activeInstanceId === player.instanceId) activeInstanceId = null;
    return snapshot();
  }

  async function seek(instanceId: string, seconds: number) {
    const player = requirePlayer(instanceId);
    await player.seek(seconds);
    return snapshot();
  }

  async function close(instanceId: string) {
    const id = String(instanceId ?? '').trim();
    const player = players.get(id);
    if (!player) return snapshot();
    await player.destroy();
    players.delete(id);
    if (activeInstanceId === id) activeInstanceId = null;
    return snapshot();
  }

  async function closeAll() {
    const ids = [...players.keys()];
    for (const id of ids) await close(id);
    return snapshot();
  }

  return Object.freeze({
    open,
    play,
    pause,
    stop,
    seek,
    close,
    closeAll,
    getState: snapshot,
    getPlayerCount: () => players.size,
  });
}

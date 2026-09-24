import type { GameMetadata, GameRegistry } from './contracts.ts';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value: unknown, label: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`Game metadata requires ${label}.`);
  return normalized;
}

function normalizeMetadata(input: GameMetadata): GameMetadata {
  const id = text(input?.id, 'id');
  if (!ID_PATTERN.test(id)) throw new Error(`Invalid game id: ${id}.`);

  return Object.freeze({
    id,
    title: text(input?.title, 'title'),
    kicker: text(input?.kicker, 'kicker'),
    description: text(input?.description, 'description'),
    family: input.family,
    capabilities: Object.freeze({
      solo: input.capabilities?.solo === true,
      passAndPlay: input.capabilities?.passAndPlay === true,
      remote: input.capabilities?.remote === true,
    }),
    rewardAuthority: input.rewardAuthority,
    lazyContent: input.lazyContent === true,
  });
}

export function createGameRegistry(entries: readonly GameMetadata[]): GameRegistry {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('Game registry requires at least one game.');
  }

  const byId = new Map<string, GameMetadata>();
  for (const entry of entries) {
    const normalized = normalizeMetadata(entry);
    if (byId.has(normalized.id)) throw new Error(`Duplicate game id: ${normalized.id}.`);
    byId.set(normalized.id, normalized);
  }

  const snapshot = Object.freeze([...byId.values()]);
  return Object.freeze({
    list: () => snapshot,
    get: (id: string) => byId.get(String(id ?? '').trim()) ?? null,
    require: (id: string) => {
      const game = byId.get(String(id ?? '').trim());
      if (!game) throw new Error(`Unknown BibleQuest game: ${String(id ?? '').trim() || 'missing'}.`);
      return game;
    },
  });
}

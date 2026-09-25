export interface TurnPlayer {
  readonly id: string;
  readonly name: string;
  readonly score: number;
}

export interface TurnState {
  readonly players: readonly TurnPlayer[];
  readonly currentIndex: number;
  readonly turn: number;
}

const PLAYER_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

function normalizePlayer(input: { id: string; name: string }): TurnPlayer {
  const id = String(input?.id ?? '').trim();
  const name = String(input?.name ?? '').trim();
  if (!PLAYER_ID.test(id)) throw new Error('Turn player id is invalid.');
  if (!name || name.length > 80) throw new Error('Turn player name is invalid.');
  return Object.freeze({ id, name, score: 0 });
}

function freezeTurnState(state: TurnState): TurnState {
  return Object.freeze({
    players: Object.freeze(state.players.map((player) => Object.freeze({ ...player }))),
    currentIndex: state.currentIndex,
    turn: state.turn,
  });
}

export function startTurnRotation(players: readonly { id: string; name: string }[]): TurnState {
  if (!Array.isArray(players) || players.length < 2 || players.length > 6) {
    throw new Error('Pass-and-play requires 2 to 6 players.');
  }
  const normalized = players.map(normalizePlayer);
  if (new Set(normalized.map((player) => player.id)).size !== normalized.length) {
    throw new Error('Pass-and-play player ids must be unique.');
  }
  return freezeTurnState({ players: normalized, currentIndex: 0, turn: 1 });
}

export function awardCurrentPlayer(state: TurnState, points: number): TurnState {
  if (!Number.isSafeInteger(points) || points < 0) throw new Error('Turn score must be a non-negative integer.');
  const players = state.players.map((player, index) =>
    index === state.currentIndex ? Object.freeze({ ...player, score: player.score + points }) : player,
  );
  return freezeTurnState({ ...state, players });
}

export function advanceTurn(state: TurnState): TurnState {
  if (!state.players.length) throw new Error('Turn state has no players.');
  return freezeTurnState({
    players: state.players,
    currentIndex: (state.currentIndex + 1) % state.players.length,
    turn: state.turn + 1,
  });
}

export type GameFamily =
  | 'multiple-choice'
  | 'recall'
  | 'detective'
  | 'timeline'
  | 'memory'
  | 'pass-and-play';

export type GameRewardAuthority = 'profile-xp' | 'profile-rewards' | 'local-only' | 'none';

export interface GameCapabilities {
  readonly solo: boolean;
  readonly passAndPlay: boolean;
  readonly remote: boolean;
}

export interface GameMetadata {
  readonly id: string;
  readonly title: string;
  readonly kicker: string;
  readonly description: string;
  readonly family: GameFamily;
  readonly capabilities: GameCapabilities;
  readonly rewardAuthority: GameRewardAuthority;
  readonly lazyContent: boolean;
}

export interface GameRegistry {
  readonly list: () => readonly GameMetadata[];
  readonly get: (id: string) => GameMetadata | null;
  readonly require: (id: string) => GameMetadata;
}

export interface MultipleChoiceQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly answerIndex: number;
  readonly explanation?: string;
  readonly reference?: string;
}

export interface GameScorePolicy {
  readonly correctXp: number;
  readonly incorrectXp: number;
}

export interface GameAnswerRecord {
  readonly questionId: string;
  readonly selectedIndex: number;
  readonly correct: boolean;
  readonly xp: number;
}

export type MultipleChoiceSessionPhase = 'question' | 'complete';

export interface MultipleChoiceSessionState {
  readonly version: 1;
  readonly gameId: string;
  readonly sessionId: string;
  readonly phase: MultipleChoiceSessionPhase;
  readonly questions: readonly MultipleChoiceQuestion[];
  readonly index: number;
  readonly score: number;
  readonly xp: number;
  readonly locked: boolean;
  readonly selectedIndex: number | null;
  readonly correct: boolean | null;
  readonly answers: readonly GameAnswerRecord[];
}

export interface GameResult {
  readonly gameId: string;
  readonly sessionId: string;
  readonly score: number;
  readonly total: number;
  readonly xp: number;
  readonly answered: number;
  readonly completed: boolean;
}

export type MultipleChoiceAction =
  | Readonly<{ type: 'answer'; choiceIndex: number }>
  | Readonly<{ type: 'next' }>;

export interface GameSessionTransition {
  readonly applied: boolean;
  readonly duplicate: boolean;
  readonly state: MultipleChoiceSessionState;
}

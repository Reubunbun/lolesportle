import { REGIONS } from '@/constants';

export type Region = typeof REGIONS[number];
export type Theme = 'light' | 'dark';

export type GetGameResponse = {
  gameKey: string,
  previousPlayers: { gameKey: string, results: Record<Region, string> },
};

export type GuessHintOptions = 'CORRECT'
  | 'INCORRECT'
  | 'PARTIAL'
  | 'CORRECT_IS_HIGHER'
  | 'CORRECT_IS_LOWER'
  | 'NEUTRAL';
export type GuessHint = {
  hint: GuessHintOptions;
  details: string;
};
export type GuessResponse = {
  guess: string;
  overall: boolean;
  region: GuessHint;
  team: GuessHint;
  role: GuessHint;
  nationality: GuessHint;
  debut: GuessHint;
  greated_achievement: GuessHint;
};

export type SavedGameData = Record<Region, {
  streak: string[];
  currentGameProgress: {
    gameKey: string;
    guesses: GuessResponse[];
    won: boolean;
  } | null,
}>;

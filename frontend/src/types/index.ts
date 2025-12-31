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

export type SavedGameData = {
    streaks: Record<string, string[]>;
    currentGameProgress: {
        dateKey: string;
        guesses: GuessResponse[];
        won: boolean;
    } | null;
};

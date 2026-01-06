import { useEffect, useReducer } from 'react';
import type { SavedGameData, GuessResponse, Region } from '@/types';
import { REGIONS } from '@/constants';

const STORAGE_KEY = 'lolesportle-gamedata';

function readFromStorage() : SavedGameData {
    try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (!item) {
            return REGIONS.reduce(
                (prev, curr) => ({ ...prev, [curr]: { streak: [], currentGameProgress: null } }),
                {} as SavedGameData,
            );
        }

        const storedData = JSON.parse(window.atob(item)) as SavedGameData ;

        for (const region of REGIONS) {
            if (!(region in storedData)) {
                storedData[region] = { streak: [], currentGameProgress: null };
            }
        }

        return storedData;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return REGIONS.reduce(
            (prev, curr) => ({ ...prev, [curr]: { streak: [], currentGameProgress: null } }),
            {} as SavedGameData,
        );
    }
}

function writeToStorage(data: SavedGameData) {
    window.localStorage.setItem(STORAGE_KEY, window.btoa(JSON.stringify(data)));
}

type GameAction =
    | { type: 'START_NEW_GAME', payload: { region: Region, gameKey: string } }
    | {
        type: 'SET_GUESS_RESULT',
        payload: { region: Region, guessResult: GuessResponse, currentGameKey: string, previousGameKey: string },
    }
    | { type: 'CHECK_STREAKS', payload: { currentGameKey: string, previousGameKey: string } };
type InternalActions = GameAction
    // Dont really want to expose these ones outside the hook
    | { type: 'HYDRATE_FROM_STORAGE', payload: { newStorageData: string } };

function gameDataReducer(state: SavedGameData, action: InternalActions): SavedGameData {
    switch (action.type) {
        case 'HYDRATE_FROM_STORAGE': {
            return JSON.parse(window.atob(action.payload.newStorageData));
        }

        case 'START_NEW_GAME': {
            return {
                ...state,
                [action.payload.region]: {
                    ...state[action.payload.region],
                    currentGameProgress: {
                        gameKey: action.payload.gameKey,
                        guesses: [],
                        won: false,
                    }
                }
            };
        }

        case 'SET_GUESS_RESULT': {
            const existingRegionData = state[action.payload.region];
            const newProgress = {
                gameKey: existingRegionData.currentGameProgress!.gameKey,
                guesses: [
                    action.payload.guessResult,
                    ...existingRegionData.currentGameProgress!.guesses,
                ],
                won: action.payload.guessResult.overall,
            };

            let newStreakData = Array.from(existingRegionData.streak);
            if (
                !existingRegionData.currentGameProgress?.won &&
                newProgress.won &&
                newProgress.gameKey === action.payload.currentGameKey
            ) {
                const gameLastWon = newStreakData.at(-1);

                if (!gameLastWon || gameLastWon !== action.payload.previousGameKey) {
                    newStreakData = [action.payload.currentGameKey];
                } else {
                    newStreakData.push(action.payload.currentGameKey);
                }
            }

            return {
                ...state,
                [action.payload.region]: {
                    streak: newStreakData,
                    currentGameProgress: newProgress,
                },
            };
        }

        case 'CHECK_STREAKS': {
            const updatedState = { ...state };
            for (const [region, { streak }] of Object.entries(state)) {
                if (!streak.length) continue;

                const gameLastWon = streak.at(-1);
                if (
                    !gameLastWon ||
                    gameLastWon === action.payload.previousGameKey ||
                    gameLastWon === action.payload.currentGameKey
                ) {
                    continue;
                }

                updatedState[region as  keyof typeof updatedState].streak = [];
            }

            return updatedState;
        }
    }
}

export default function useSavedGameData() {
    const [state, internalDispatch] = useReducer(gameDataReducer, readFromStorage());

    useEffect(() => {
        writeToStorage(state);
    }, [state]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key !== STORAGE_KEY || !e.newValue) return;
            internalDispatch({
                type: 'HYDRATE_FROM_STORAGE',
                payload: { newStorageData: e.newValue } },
            );
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    function dispatch(action: GameAction) {
        internalDispatch(action);
    }

    return [state, dispatch] as const;
}

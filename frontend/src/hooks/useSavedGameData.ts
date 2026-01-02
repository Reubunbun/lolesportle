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
    | { type: 'SET_GUESS_RESULT', payload: { region: Region, guessResult: GuessResponse } };
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
            const newRegionData = { ...state[action.payload.region] };
            const newProgress = {
                gameKey: newRegionData.currentGameProgress!.gameKey,
                guesses: [
                    action.payload.guessResult,
                    ...newRegionData.currentGameProgress!.guesses,
                ],
                won: action.payload.guessResult.overall,
            };

            if (newProgress.won) {
                let currentStreak = [ ...newRegionData.streak ];
                const lastWonDate = currentStreak.pop();
                const justWonDate = newProgress.gameKey;
                if (lastWonDate) {
                    const ONE_DAY = 24 * 60 * 60 * 1000;
                    const dateLastWon = new Date(lastWonDate);
                    const dateJustWon = new Date(justWonDate);
                    if (Math.abs(dateLastWon.getTime() - dateJustWon.getTime()) === ONE_DAY) {
                        currentStreak.push(justWonDate)
                    } else {
                        currentStreak = [justWonDate];
                    }
                } else {
                    currentStreak = [justWonDate];
                }

                newRegionData.streak = currentStreak;
            }

            newRegionData.currentGameProgress = newProgress;

            return {
                ...state,
                [action.payload.region]: newRegionData,
            };
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

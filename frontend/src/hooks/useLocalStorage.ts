import { useState, useEffect } from 'react';
import { type SavedGameData } from '@/types';

export default function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            const decoded = window.atob(item || '');
            return item ? JSON.parse(decoded) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((value: T) => T)) => {
        try {
            const valueToStore = value instanceof Function
                ? value(storedValue)
                : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, window.btoa(JSON.stringify(valueToStore)));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    // Trick to keep things working if multiple tabs are used
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key) {
                try {
                    const decoded = window.atob(event.newValue || '');
                    const newValue = decoded ? JSON.parse(decoded) : initialValue;
                    setStoredValue(newValue);
                } catch (error) {
                    console.error(`Error parsing localStorage key "${key}" on storage event:`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, initialValue]);

    return [storedValue, setValue] as const;
};

export function useSavedGameData() {
    return useLocalStorage<SavedGameData>('savedGameData', {
        streaks: {},
        currentGameProgress: null,
    });
}

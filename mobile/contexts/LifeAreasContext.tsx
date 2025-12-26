/**
 * Life Areas Context for Daymark mobile app
 * Manages life areas selection and state throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LifeArea, lifeAreasApi } from '@/lib/api';
import { useAuth } from './AuthContext';

const SELECTED_LIFE_AREA_KEY = 'selected_life_area_id';

interface LifeAreasContextType {
    lifeAreas: LifeArea[];
    selectedLifeArea: LifeArea | null;
    isLoading: boolean;
    error: string | null;
    selectLifeArea: (id: string) => void;
    createLifeArea: (name: string, color?: string) => Promise<LifeArea>;
    refreshLifeAreas: () => Promise<void>;
}

const LifeAreasContext = createContext<LifeAreasContextType | undefined>(undefined);

export function LifeAreasProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
    const [selectedLifeArea, setSelectedLifeArea] = useState<LifeArea | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load life areas and restore selected
    const loadLifeAreas = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const areas = await lifeAreasApi.getAll();
            const activeAreas = areas.filter(a => !a.isArchived);
            setLifeAreas(activeAreas);

            // Restore selected life area from storage
            const savedId = await AsyncStorage.getItem(SELECTED_LIFE_AREA_KEY);

            if (savedId) {
                const savedArea = activeAreas.find(a => a.id === savedId);
                if (savedArea) {
                    setSelectedLifeArea(savedArea);
                } else if (activeAreas.length > 0) {
                    // Saved area no longer exists, select first
                    setSelectedLifeArea(activeAreas[0]);
                    await AsyncStorage.setItem(SELECTED_LIFE_AREA_KEY, activeAreas[0].id);
                }
            } else if (activeAreas.length > 0) {
                // No saved selection, select first
                setSelectedLifeArea(activeAreas[0]);
                await AsyncStorage.setItem(SELECTED_LIFE_AREA_KEY, activeAreas[0].id);
            }
        } catch (err) {
            console.error('Failed to load life areas:', err);
            setError('Failed to load life areas');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Only load life areas when authenticated
    useEffect(() => {
        if (authLoading) {
            // Still checking auth status, wait
            return;
        }

        if (isAuthenticated) {
            loadLifeAreas();
        } else {
            // Not authenticated, reset state
            setLifeAreas([]);
            setSelectedLifeArea(null);
            setIsLoading(false);
        }
    }, [isAuthenticated, authLoading, loadLifeAreas]);

    const selectLifeArea = useCallback(async (id: string) => {
        const area = lifeAreas.find(a => a.id === id);
        if (area) {
            setSelectedLifeArea(area);
            await AsyncStorage.setItem(SELECTED_LIFE_AREA_KEY, id);
        }
    }, [lifeAreas]);

    const createLifeArea = useCallback(async (name: string, color?: string) => {
        const newArea = await lifeAreasApi.create({ name, color });
        setLifeAreas(prev => [...prev, newArea]);
        return newArea;
    }, []);

    const refreshLifeAreas = useCallback(async () => {
        await loadLifeAreas();
    }, [loadLifeAreas]);

    return (
        <LifeAreasContext.Provider
            value={{
                lifeAreas,
                selectedLifeArea,
                isLoading,
                error,
                selectLifeArea,
                createLifeArea,
                refreshLifeAreas,
            }}
        >
            {children}
        </LifeAreasContext.Provider>
    );
}

export function useLifeAreas() {
    const context = useContext(LifeAreasContext);
    if (context === undefined) {
        throw new Error('useLifeAreas must be used within a LifeAreasProvider');
    }
    return context;
}

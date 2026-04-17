/**
 * Life Areas Context for Daymark mobile app
 * Ported from mobile-old/contexts/LifeAreasContext.tsx
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LifeArea, lifeAreasApi } from '../lib/daymark-api';
import { useAuth } from './AuthContext';

const SELECTED_LIFE_AREA_KEY = 'selected_life_area_id';

interface LifeAreasContextType {
    lifeAreas: LifeArea[];
    selectedLifeArea: LifeArea | null;
    isLoading: boolean;
    error: string | null;
    selectLifeArea: (id: string) => void;
    createLifeArea: (name: string, color?: string) => Promise<LifeArea>;
    updateLifeArea: (id: string, updates: { name?: string; color?: string; order?: number }) => Promise<LifeArea>;
    archiveLifeArea: (id: string) => Promise<void>;
    restoreLifeArea: (id: string) => Promise<LifeArea>;
    refreshLifeAreas: () => Promise<void>;
    reorderLifeAreas: (orderedIds: string[]) => Promise<void>;
}

const LifeAreasContext = createContext<LifeAreasContextType | undefined>(undefined);

export function LifeAreasProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
    const [selectedLifeArea, setSelectedLifeArea] = useState<LifeArea | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLifeAreas = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const areas = await lifeAreasApi.getAll();
            const activeAreas = areas.filter(a => !a.isArchived);
            setLifeAreas(activeAreas);

            const savedId = await AsyncStorage.getItem(SELECTED_LIFE_AREA_KEY);
            if (savedId) {
                const savedArea = activeAreas.find(a => a.id === savedId);
                if (savedArea) {
                    setSelectedLifeArea(savedArea);
                } else if (activeAreas.length > 0) {
                    setSelectedLifeArea(activeAreas[0]);
                    await AsyncStorage.setItem(SELECTED_LIFE_AREA_KEY, activeAreas[0].id);
                }
            } else if (activeAreas.length > 0) {
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

    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) {
            loadLifeAreas();
        } else {
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

    const updateLifeArea = useCallback(async (
        id: string,
        updates: { name?: string; color?: string; order?: number }
    ) => {
        const updated = await lifeAreasApi.update(id, updates);
        setLifeAreas((prev) => prev.map((area) => (area.id === id ? updated : area)));
        if (selectedLifeArea?.id === id) {
            setSelectedLifeArea(updated);
        }
        return updated;
    }, [selectedLifeArea?.id]);

    const archiveLifeArea = useCallback(async (id: string) => {
        await lifeAreasApi.archive(id);
        setLifeAreas((prev) => prev.filter((area) => area.id !== id));
        if (selectedLifeArea?.id === id) {
            const remaining = lifeAreas.filter((area) => area.id !== id);
            const next = remaining[0] ?? null;
            setSelectedLifeArea(next);
            if (next) {
                await AsyncStorage.setItem(SELECTED_LIFE_AREA_KEY, next.id);
            } else {
                await AsyncStorage.removeItem(SELECTED_LIFE_AREA_KEY);
            }
        }
    }, [lifeAreas, selectedLifeArea?.id]);

    const restoreLifeArea = useCallback(async (id: string) => {
        const restored = await lifeAreasApi.restore(id);
        setLifeAreas((prev) => {
            if (prev.some((a) => a.id === restored.id)) {
                return prev.map((a) => (a.id === restored.id ? restored : a));
            }
            return [...prev, restored].sort((a, b) => a.order - b.order);
        });
        return restored;
    }, []);

    const refreshLifeAreas = useCallback(async () => {
        await loadLifeAreas();
    }, [loadLifeAreas]);

    const reorderLifeAreas = useCallback(async (orderedIds: string[]) => {
        setLifeAreas((prev) => {
            const map = new Map(prev.map((a) => [a.id, a]));
            return orderedIds.map((id, index) => {
                const area = map.get(id);
                return area ? { ...area, order: index + 1 } : null;
            }).filter((a): a is LifeArea => a !== null);
        });
        try {
            const ordered = await lifeAreasApi.reorder(orderedIds);
            setLifeAreas(ordered);
        } catch (err) {
            loadLifeAreas();
            throw err;
        }
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
                updateLifeArea,
                archiveLifeArea,
                restoreLifeArea,
                refreshLifeAreas,
                reorderLifeAreas,
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

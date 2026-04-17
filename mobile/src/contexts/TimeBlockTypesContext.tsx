/**
 * Time Block Types Context for Daymark mobile app
 * Ported from mobile-old/contexts/TimeBlockTypesContext.tsx
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { timeBlockTypesApi, TimeBlockType } from '../lib/daymark-api';
import { useAuth } from './AuthContext';

interface TimeBlockTypesContextType {
    types: TimeBlockType[];
    activeTypes: TimeBlockType[];
    isLoading: boolean;
    error: string | null;
    refreshTypes: () => Promise<void>;
    addType: (data: { name: string; color: string }) => Promise<TimeBlockType>;
    updateType: (id: string, data: Partial<TimeBlockType>) => Promise<TimeBlockType>;
    deleteType: (id: string) => Promise<void>;
    reorderTypes: (orderedIds: string[]) => Promise<void>;
}

const TimeBlockTypesContext = createContext<TimeBlockTypesContextType | undefined>(undefined);

export function TimeBlockTypesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [types, setTypes] = useState<TimeBlockType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTypes = useCallback(async () => {
        if (!user) {
            setTypes([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await timeBlockTypesApi.getAll();
            setTypes(data);
        } catch (err) {
            console.error('Failed to load time block types:', err);
            setError(err instanceof Error ? err.message : 'Failed to load types');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadTypes();
    }, [loadTypes]);

    const addType = useCallback(async (data: { name: string; color: string }) => {
        const newType = await timeBlockTypesApi.create(data);
        setTypes(prev => [...prev, newType].sort((a, b) => a.order - b.order));
        return newType;
    }, []);

    const updateType = useCallback(async (id: string, data: Partial<TimeBlockType>) => {
        const updated = await timeBlockTypesApi.update(id, data);
        setTypes(prev => prev.map(t => t.id === id ? updated : t).sort((a, b) => a.order - b.order));
        return updated;
    }, []);

    const deleteType = useCallback(async (id: string) => {
        await timeBlockTypesApi.delete(id);
        setTypes(prev => prev.filter(t => t.id !== id));
    }, []);

    const reorderTypes = useCallback(async (orderedIds: string[]) => {
        setTypes(prev => {
            const newTypes = [...prev];
            orderedIds.forEach((id, index) => {
                const type = newTypes.find(t => t.id === id);
                if (type) type.order = index;
            });
            return newTypes.sort((a, b) => a.order - b.order);
        });
        try {
            const updates = orderedIds.map((id, index) => ({ id, order: index }));
            const serverTypes = await timeBlockTypesApi.reorder(updates);
            setTypes(serverTypes);
        } catch (err) {
            await loadTypes();
            throw err;
        }
    }, [loadTypes]);

    return (
        <TimeBlockTypesContext.Provider
            value={{
                types,
                activeTypes: types,
                isLoading,
                error,
                refreshTypes: loadTypes,
                addType,
                updateType,
                deleteType,
                reorderTypes,
            }}
        >
            {children}
        </TimeBlockTypesContext.Provider>
    );
}

export function useTimeBlockTypes() {
    const context = useContext(TimeBlockTypesContext);
    if (context === undefined) {
        throw new Error('useTimeBlockTypes must be used within a TimeBlockTypesProvider');
    }
    return context;
}

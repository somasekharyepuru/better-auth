/**
 * Time Block Types Context for Daymark mobile app
 * Manages custom time block types for scheduling
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { TimeBlockType, timeBlockTypesApi } from '@/lib/api';

// Default colors for time block types
export const TYPE_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
    'Deep Work': {
        bg: '#3B82F615',
        text: '#3B82F6',
        hex: '#3B82F6',
    },
    'Meeting': {
        bg: '#8B5CF615',
        text: '#8B5CF6',
        hex: '#8B5CF6',
    },
    'Personal': {
        bg: '#10B98115',
        text: '#10B981',
        hex: '#10B981',
    },
    'Break': {
        bg: '#F59E0B15',
        text: '#F59E0B',
        hex: '#F59E0B',
    },
    'Admin': {
        bg: '#6B728015',
        text: '#6B7280',
        hex: '#6B7280',
    },
};

// Get color styling for a time block type
export function getTypeColorStyles(typeName: string, typeColor?: string): { bg: string; text: string } {
    // If custom color provided, use it
    if (typeColor) {
        return {
            bg: `${typeColor}15`,
            text: typeColor,
        };
    }

    // Fallback to predefined colors
    return TYPE_COLORS[typeName] || TYPE_COLORS['Admin'];
}

interface TimeBlockTypesContextType {
    types: TimeBlockType[];
    activeTypes: TimeBlockType[];
    isLoading: boolean;
    error: string | null;
    refreshTypes: () => Promise<void>;
    addType: (data: { name: string; color?: string; icon?: string }) => Promise<TimeBlockType>;
    updateType: (id: string, data: { name?: string; color?: string; icon?: string; isActive?: boolean }) => Promise<TimeBlockType>;
    deleteType: (id: string) => Promise<void>;
    getTypeColor: (typeName: string) => string;
}

const TimeBlockTypesContext = createContext<TimeBlockTypesContextType | null>(null);

export function TimeBlockTypesProvider({ children }: { children: React.ReactNode }) {
    const [types, setTypes] = useState<TimeBlockType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTypes = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await timeBlockTypesApi.getAll();
            setTypes(data);
        } catch (err) {
            console.error('Failed to fetch time block types:', err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addType = useCallback(
        async (data: { name: string; color?: string; icon?: string }) => {
            const newType = await timeBlockTypesApi.create(data);
            setTypes((prev) => [...prev, newType]);
            return newType;
        },
        [],
    );

    const updateType = useCallback(
        async (id: string, data: { name?: string; color?: string; icon?: string; isActive?: boolean }) => {
            const updated = await timeBlockTypesApi.update(id, data);
            setTypes((prev) => prev.map((t) => (t.id === id ? updated : t)));
            return updated;
        },
        [],
    );

    const deleteType = useCallback(async (id: string) => {
        await timeBlockTypesApi.delete(id);
        setTypes((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getTypeColor = useCallback(
        (typeName: string): string => {
            const type = types.find((t) => t.name === typeName);
            if (type) {
                return type.color || TYPE_COLORS[typeName]?.hex || TYPE_COLORS['Admin'].hex;
            }
            return TYPE_COLORS[typeName]?.hex || TYPE_COLORS['Admin'].hex;
        },
        [types],
    );

    const activeTypes = types.filter((t) => t.isActive);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    return (
        <TimeBlockTypesContext.Provider
            value={{
                types,
                activeTypes,
                isLoading,
                error,
                refreshTypes: fetchTypes,
                addType,
                updateType,
                deleteType,
                getTypeColor,
            }}
        >
            {children}
        </TimeBlockTypesContext.Provider>
    );
}

export function useTimeBlockTypes() {
    const context = useContext(TimeBlockTypesContext);
    if (!context) {
        throw new Error('useTimeBlockTypes must be used within a TimeBlockTypesProvider');
    }
    return context;
}

// Optional hook that doesn't throw - returns null if outside provider
export function useTimeBlockTypesOptional() {
    return useContext(TimeBlockTypesContext);
}

// Fallback types for when context is not available
export const DEFAULT_TIME_BLOCK_TYPES = ['Deep Work', 'Meeting', 'Personal', 'Break', 'Admin'];

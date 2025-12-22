"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { lifeAreasApi, LifeArea } from "@/lib/daymark-api";

interface LifeAreasContextValue {
    lifeAreas: LifeArea[];
    selectedLifeArea: LifeArea | null;
    isLoading: boolean;
    error: string | null;
    selectLifeArea: (id: string) => void;
    refreshLifeAreas: () => Promise<void>;
    createLifeArea: (name: string, color?: string) => Promise<LifeArea>;
    updateLifeArea: (id: string, data: { name?: string; color?: string }) => Promise<LifeArea>;
    archiveLifeArea: (id: string) => Promise<void>;
}

const LifeAreasContext = createContext<LifeAreasContextValue | undefined>(undefined);

export function LifeAreasProvider({ children }: { children: React.ReactNode }) {
    const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
    const [selectedLifeArea, setSelectedLifeArea] = useState<LifeArea | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load life areas on mount
    const loadLifeAreas = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const areas = await lifeAreasApi.getAll();
            setLifeAreas(areas);

            // If no selected area, select the first one or get default
            if (areas.length > 0 && !selectedLifeArea) {
                // Try to get saved preference from localStorage
                const savedId = localStorage.getItem("selectedLifeAreaId");
                const savedArea = savedId ? areas.find((a) => a.id === savedId) : null;
                setSelectedLifeArea(savedArea || areas[0]);
            }
        } catch (err) {
            console.error("Failed to load life areas:", err);
            setError(err instanceof Error ? err.message : "Failed to load life areas");
        } finally {
            setIsLoading(false);
        }
    }, [selectedLifeArea]);

    useEffect(() => {
        loadLifeAreas();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Select a life area
    const selectLifeArea = useCallback(
        (id: string) => {
            const area = lifeAreas.find((a) => a.id === id);
            if (area) {
                setSelectedLifeArea(area);
                localStorage.setItem("selectedLifeAreaId", id);
            }
        },
        [lifeAreas]
    );

    // Create a new life area
    const createLifeArea = useCallback(async (name: string, color?: string) => {
        const newArea = await lifeAreasApi.create({ name, color });
        setLifeAreas((prev) => [...prev, newArea]);
        return newArea;
    }, []);

    // Update a life area
    const updateLifeArea = useCallback(
        async (id: string, data: { name?: string; color?: string }) => {
            const updated = await lifeAreasApi.update(id, data);
            setLifeAreas((prev) => prev.map((a) => (a.id === id ? updated : a)));
            if (selectedLifeArea?.id === id) {
                setSelectedLifeArea(updated);
            }
            return updated;
        },
        [selectedLifeArea]
    );

    // Archive a life area
    const archiveLifeArea = useCallback(
        async (id: string) => {
            await lifeAreasApi.archive(id);
            setLifeAreas((prev) => prev.filter((a) => a.id !== id));

            // If archived the selected area, select another
            if (selectedLifeArea?.id === id) {
                const remaining = lifeAreas.filter((a) => a.id !== id);
                setSelectedLifeArea(remaining[0] || null);
            }
        },
        [selectedLifeArea, lifeAreas]
    );

    return (
        <LifeAreasContext.Provider
            value={{
                lifeAreas,
                selectedLifeArea,
                isLoading,
                error,
                selectLifeArea,
                refreshLifeAreas: loadLifeAreas,
                createLifeArea,
                updateLifeArea,
                archiveLifeArea,
            }}
        >
            {children}
        </LifeAreasContext.Provider>
    );
}

export function useLifeAreas() {
    const context = useContext(LifeAreasContext);
    if (context === undefined) {
        throw new Error("useLifeAreas must be used within a LifeAreasProvider");
    }
    return context;
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { timeBlockTypesApi, TimeBlockType } from "@/lib/settings-api";

// Default colors for time block types
export const TYPE_COLORS: Record<
  string,
  { bg: string; text: string; hex: string }
> = {
  "Deep Work": {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    hex: "#3B82F6",
  },
  Meeting: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    hex: "#8B5CF6",
  },
  Personal: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    hex: "#10B981",
  },
  Break: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    hex: "#F59E0B",
  },
  Admin: {
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-700 dark:text-gray-300",
    hex: "#6B7280",
  },
};

// Generate color classes from hex color
export function getColorClasses(color: string): string {
  // Predefined color mappings
  const colorMap: Record<string, string> = {
    "#3B82F6":
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "#8B5CF6":
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "#10B981":
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "#F59E0B":
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "#6B7280": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    "#EF4444": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "#EC4899":
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    "#6366F1":
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    "#14B8A6":
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    "#F97316":
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    colorMap[color.toUpperCase()] ||
    colorMap[color] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
  );
}

interface TimeBlockTypesContextType {
  types: TimeBlockType[];
  activeTypes: TimeBlockType[];
  isLoading: boolean;
  error: string | null;
  refreshTypes: () => Promise<void>;
  addType: (data: {
    name: string;
    color?: string;
    icon?: string;
  }) => Promise<TimeBlockType>;
  updateType: (
    id: string,
    data: { name?: string; color?: string; icon?: string; isActive?: boolean },
  ) => Promise<TimeBlockType>;
  deleteType: (id: string) => Promise<void>;
  getTypeColor: (typeName: string) => string;
}

const TimeBlockTypesContext = createContext<TimeBlockTypesContextType | null>(
  null,
);

export function TimeBlockTypesProvider({ children }: { children: ReactNode }) {
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
      console.error("Failed to fetch time block types:", err);
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
    async (
      id: string,
      data: {
        name?: string;
        color?: string;
        icon?: string;
        isActive?: boolean;
      },
    ) => {
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
        return getColorClasses(type.color);
      }
      // Fallback to predefined colors
      return TYPE_COLORS[typeName]
        ? `${TYPE_COLORS[typeName].bg} ${TYPE_COLORS[typeName].text}`
        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
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
    throw new Error(
      "useTimeBlockTypes must be used within a TimeBlockTypesProvider",
    );
  }
  return context;
}

// Optional hook that doesn't throw - returns null if outside provider
export function useTimeBlockTypesOptional() {
  return useContext(TimeBlockTypesContext);
}

// Fallback types for when context is not available
export const DEFAULT_TIME_BLOCK_TYPES = [
  "Deep Work",
  "Meeting",
  "Personal",
  "Break",
  "Admin",
];

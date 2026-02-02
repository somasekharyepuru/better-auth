"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useSettingsOptional } from "@/lib/settings-context";

interface ThemeSwitcherProps {
  variant?: "icon" | "dropdown";
  className?: string;
}

/**
 * ThemeSwitcher component
 * 
 * Handles theme switching via:
 * 1. next-themes for immediate local state (localStorage persistence)
 * 2. Backend settings API for cross-device sync (when user is authenticated)
 * 
 * This component should be used in the header/profile area for user control.
 */
export function ThemeSwitcher({ variant = "icon", className = "" }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const settingsContext = useSettingsOptional();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = async (newTheme: string) => {
    // Update local theme immediately via next-themes
    setTheme(newTheme);

    // If user is authenticated, also update backend settings
    if (settingsContext?.updateSettings) {
      try {
        await settingsContext.updateSettings({ theme: newTheme });
      } catch (error) {
        // Silent fail - local theme is still updated
        console.error("Failed to sync theme to backend:", error);
      }
    }
  };

  const cycleTheme = () => {
    const themes = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme || "system");
    const nextIndex = (currentIndex + 1) % themes.length;
    handleThemeChange(themes[nextIndex]);
  };

  if (!mounted) {
    // Return placeholder to avoid hydration mismatch
    return (
      <button
        className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`}
        disabled
      >
        <div className="w-4 h-4" />
      </button>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 mb-1">
          Theme
        </span>
        {[
          { value: "light", label: "Light", icon: Sun },
          { value: "dark", label: "Dark", icon: Moon },
          { value: "system", label: "System", icon: Monitor },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => handleThemeChange(value)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              theme === value
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    );
  }

  // Icon variant - cycles through themes on click
  const Icon = resolvedTheme === "dark" ? Moon : Sun;
  const title = `Current: ${theme} (click to change)`;

  return (
    <button
      onClick={cycleTheme}
      className={`p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={title}
      aria-label={`Theme: ${theme}. Click to change.`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

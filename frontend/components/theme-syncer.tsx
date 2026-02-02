"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSettingsOptional } from "@/lib/settings-context";

/**
 * ThemeSyncer component
 * 
 * This component syncs the theme preference from the backend settings
 * to the next-themes ThemeProvider ONLY on initial load (first sync).
 * 
 * After the initial sync, theme changes are controlled by:
 * 1. ThemeSwitcher component (user interaction)
 * 2. localStorage (next-themes built-in persistence)
 * 
 * This prevents the theme from being overridden on every navigation
 * while still ensuring cross-device sync on login.
 */
export function ThemeSyncer() {
  const { setTheme } = useTheme();
  const settingsContext = useSettingsOptional();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once when settings are first loaded from backend
    if (hasSynced.current) return;
    
    // Only sync if we have settings loaded from the backend
    if (settingsContext?.settings?.theme && !settingsContext.isLoading) {
      setTheme(settingsContext.settings.theme);
      hasSynced.current = true;
    }
  }, [settingsContext?.settings?.theme, settingsContext?.isLoading, setTheme]);

  // This component doesn't render anything
  return null;
}

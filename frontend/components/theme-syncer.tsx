"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingsOptional } from "@/lib/settings-context";

/**
 * ThemeSyncer component
 * This component syncs the theme preference from the backend settings
 * to the next-themes ThemeProvider. It should be placed inside the
 * SettingsProvider to have access to user settings.
 */
export function ThemeSyncer() {
  const { setTheme } = useTheme();
  const settingsContext = useSettingsOptional();

  useEffect(() => {
    // Only sync if we have settings loaded from the backend
    if (settingsContext?.settings?.theme) {
      setTheme(settingsContext.settings.theme);
    }
  }, [settingsContext?.settings?.theme, setTheme]);

  // This component doesn't render anything
  return null;
}

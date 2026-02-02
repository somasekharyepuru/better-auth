"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { settingsApi } from "@/lib/settings-api"

// Component to sync theme from backend settings
function ThemeSyncFromBackend() {
    const { setTheme } = useTheme()
    const [hasSynced, setHasSynced] = React.useState(false)

    React.useEffect(() => {
        // Only sync once on initial load
        if (hasSynced) return

        const syncThemeFromBackend = async () => {
            try {
                const settings = await settingsApi.get()
                if (settings.theme && ['light', 'dark', 'system'].includes(settings.theme)) {
                    setTheme(settings.theme)
                }
            } catch (error) {
                // User not authenticated or settings not available
                // Theme will use localStorage fallback from next-themes
            } finally {
                setHasSynced(true)
            }
        }

        syncThemeFromBackend()
    }, [setTheme, hasSynced])

    return null
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            <ThemeSyncFromBackend />
            {children}
        </NextThemesProvider>
    )
}

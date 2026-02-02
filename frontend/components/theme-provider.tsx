"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * ThemeProvider wraps next-themes provider.
 * 
 * Theme persistence is handled by next-themes using localStorage (key: "theme").
 * No API calls are made here - theme syncs from backend only when:
 * 1. User logs in (via ThemeSyncer in authenticated pages)
 * 2. User changes theme (via ThemeSwitcher component)
 * 
 * This prevents unnecessary API calls on every page reload.
 */
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            {children}
        </NextThemesProvider>
    )
}

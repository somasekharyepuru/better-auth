"use client";

import { usePathname } from "next/navigation";
import { UnifiedHeader } from "@/components/unified-header";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { SettingsProvider } from "@/lib/settings-context";
import { LifeAreasProvider } from "@/lib/life-areas-context";
import { FocusProvider } from "@/lib/focus-context";
import { TimeBlockTypesProvider } from "@/lib/time-block-types-context";
import { FloatingFocusTimer } from "@/components/focus/floating-focus-timer";
import { ThemeSyncer } from "@/components/theme-syncer";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for every logged-in surface: same providers, UnifiedHeader,
 * and content width rules. Header offset (`pt-20`) is applied on the full-bleed
 * `bg-premium` wrapper so the strip under the fixed header is tinted, not the
 * default page background.
 */
export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const orgSegments = pathname?.split("/") ?? [];
  const isOrgDashboard =
    orgSegments[1] === "organizations" &&
    orgSegments.length > 2 &&
    !["create", "invite", "transfer"].includes(orgSegments[2]);
  const isFullWidth = isOrgDashboard;

  return (
    <SettingsProvider>
      <ThemeSyncer />
      <TimeBlockTypesProvider>
        <LifeAreasProvider>
          <FocusProvider>
            <ImpersonationBanner />
            <UnifiedHeader />
            <main
              className={cn(
                "min-h-screen",
                isFullWidth && "p-0",
              )}
            >
              {isFullWidth ? (
                children
              ) : (
                <div className="min-h-screen w-full bg-premium pb-8 pt-18">
                  <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-2 lg:px-8">
                    {children}
                  </div>
                </div>
              )}
            </main>
            <FloatingFocusTimer />
          </FocusProvider>
        </LifeAreasProvider>
      </TimeBlockTypesProvider>
    </SettingsProvider>
  );
}

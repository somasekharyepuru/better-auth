"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { type LucideIcon, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface SettingsNavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

interface SettingsSidebarProps {
  items: SettingsNavItem[]
  basePath: string
  title: string
  children: React.ReactNode
}

export function SettingsSidebar({
  items,
  basePath,
  title,
  children,
}: SettingsSidebarProps) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const activeItem = items.find((item) => {
    // Exact match or prefix match (but not for basePath itself)
    return pathname === item.href || (
      item.href !== basePath && pathname.startsWith(item.href + "/")
    )
  })

  const renderNavItems = (mobile = false, collapsed = false) => (
    <TooltipProvider delayDuration={120}>
      <nav className={cn(
        "space-y-1",
        mobile ? "flex flex-col" : "w-full"
      )}>
      {items.map((item) => {
        const isActive = pathname === item.href || (
          item.href !== basePath && pathname.startsWith(item.href + "/")
        )
        const Icon = item.icon

        if (mobile) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => {
                setIsSheetOpen(false)
              }}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        }

        const desktopNavItem = (
          <Link
            key={item.href}
            href={item.href}
            aria-label={collapsed ? item.title : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.title}
          </Link>
        )

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{desktopNavItem}</TooltipTrigger>
              <TooltipContent side="right" align="center">
                {item.title}
              </TooltipContent>
            </Tooltip>
          )
        }

        return desktopNavItem
      })}
      </nav>
    </TooltipProvider>
  )

  // Mobile: Use Sheet (slide-in menu)
  if (isMobile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate between {title.toLowerCase()} sections.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                {renderNavItems(true)}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Show current page title in mobile */}
        {activeItem && (
          <div className="text-sm text-muted-foreground">
            {activeItem.title}
          </div>
        )}

        {children}
      </div>
    )
  }

  // Desktop: Use inline sidebar
  return (
    <div className="space-y-6">
      <div className={cn("flex gap-6 min-w-0")}>
        <div className={cn(
          "shrink-0 transition-[width] duration-200",
          isDesktopCollapsed ? "w-14" : "w-48"
        )}>
          <div className="mb-2 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDesktopCollapsed((prev) => !prev)}
              aria-label={isDesktopCollapsed ? "Expand menu" : "Collapse menu"}
            >
              {isDesktopCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          {renderNavItems(false, isDesktopCollapsed)}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}

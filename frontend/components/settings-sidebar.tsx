"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { type LucideIcon, Menu } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

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
  const activeItem = items.find((item) => {
    // Exact match or prefix match (but not for basePath itself)
    return pathname === item.href || (
      item.href !== basePath && pathname.startsWith(item.href + "/")
    )
  })

  const renderNavItems = (mobile = false) => (
    <nav className={cn(
      "space-y-1",
      mobile ? "flex flex-col" : "w-48 shrink-0"
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
                // Close the sheet when clicking a link
                document.querySelector('[data-state="open"]')?.setAttribute('data-state', 'closed')
              }}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        }

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
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )

  // Mobile: Use Sheet (slide-in menu)
  if (isMobile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>{title}</SheetTitle>
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
      <div className={cn("flex gap-6")}>
        {renderNavItems(false)}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

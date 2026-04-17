"use client";

import * as React from "react"
import { Fragment } from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal, Home } from "lucide-react"
import { cn } from "@/lib/utils"

// ==========================================
// Shadcn/UI Composable Breadcrumb Components
// ==========================================

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

// ==========================================
// Productivity Simple Breadcrumb (items-based)
// ==========================================

export interface SimpleBreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface SimpleBreadcrumbProps {
  items: SimpleBreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
  maxLabelLength?: number;
}

function SimpleBreadcrumb({
  items,
  className = "",
  showHomeIcon = true,
  maxLabelLength = 30,
}: SimpleBreadcrumbProps) {
  if (!items || items.length === 0) return null;

  const truncateLabel = (label: string) => {
    if (maxLabelLength > 0 && label.length > maxLabelLength) {
      return `${label.slice(0, maxLabelLength)}…`;
    }
    return label;
  };

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          const itemKey = `${item.label}-${item.href || index}`;
          return (
            <Fragment key={itemKey}>
              <li className="flex items-center min-w-0">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                    title={item.label}
                  >
                    {isFirst && showHomeIcon && <Home className="w-3.5 h-3.5 flex-shrink-0" />}
                    {item.icon && !isFirst && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="truncate">{truncateLabel(item.label)}</span>
                  </Link>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 ${isLast ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-500 dark:text-gray-400"}`}
                    {...(isLast && { "aria-current": "page" as const })}
                    title={item.label}
                  >
                    {isFirst && showHomeIcon && <Home className="w-3.5 h-3.5 flex-shrink-0" />}
                    {item.icon && !isFirst && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="truncate">{truncateLabel(item.label)}</span>
                  </span>
                )}
              </li>
              {!isLast && (
                <li className="text-gray-300 dark:text-gray-600 flex-shrink-0" aria-hidden="true">
                  <ChevronRight className="w-4 h-4" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// Pre-configured breadcrumb patterns for common routes
const BREADCRUMB_ROUTES = {
  dashboard: { label: "Dashboard", href: "/" },
  tools: { label: "Tools", href: "/tools" },
  profile: { label: "Profile", href: "/profile" },
  calendar: { label: "Calendar", href: "/calendar" },
  settings: { label: "Settings", href: "/settings" },
  organizations: { label: "Organizations", href: "/organizations" },
  help: { label: "Help", href: "/help" },
} as const;

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  SimpleBreadcrumb,
  BREADCRUMB_ROUTES,
}

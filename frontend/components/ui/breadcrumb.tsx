"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
  /** Maximum characters for labels before truncation (0 = no truncation) */
  maxLabelLength?: number;
}

export function Breadcrumb({
  items,
  className = "",
  showHomeIcon = true,
  maxLabelLength = 30,
}: BreadcrumbProps) {
  // Guard against empty items
  if (!items || items.length === 0) {
    return null;
  }

  const truncateLabel = (label: string) => {
    if (maxLabelLength > 0 && label.length > maxLabelLength) {
      return `${label.slice(0, maxLabelLength)}…`;
    }
    return label;
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm ${className}`}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          // Create a stable key from label + href
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
                    {isFirst && showHomeIcon && (
                      <Home className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    {item.icon && !isFirst && (
                      <span className="flex-shrink-0">{item.icon}</span>
                    )}
                    <span className="truncate">
                      {truncateLabel(item.label)}
                    </span>
                  </Link>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 ${
                      isLast
                        ? "text-gray-900 dark:text-gray-100 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                    {...(isLast && { "aria-current": "page" })}
                    title={item.label}
                  >
                    {isFirst && showHomeIcon && (
                      <Home className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    {item.icon && !isFirst && (
                      <span className="flex-shrink-0">{item.icon}</span>
                    )}
                    <span className="truncate">
                      {truncateLabel(item.label)}
                    </span>
                  </span>
                )}
              </li>
              {!isLast && (
                <li
                  className="text-gray-300 dark:text-gray-600 flex-shrink-0"
                  aria-hidden="true"
                >
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
export const BREADCRUMB_ROUTES = {
  dashboard: { label: "Dashboard", href: "/" },
  tools: { label: "Tools", href: "/tools" },
  profile: { label: "Profile", href: "/profile" },
  calendar: { label: "Calendar", href: "/calendar" },
  settings: { label: "Settings", href: "/settings" },
  organizations: { label: "Organizations", href: "/organizations" },
  help: { label: "Help", href: "/help" },
} as const;

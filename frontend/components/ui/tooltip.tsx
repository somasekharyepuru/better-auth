"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback, cloneElement, isValidElement } from "react"
import { createPortal } from "react-dom"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// ==========================================
// Shadcn/UI Composable Tooltip Components
// ==========================================

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// ==========================================
// Productivity Simple Tooltip (content-based)
// ==========================================

interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function SimpleTooltip({
  content,
  children,
  position = "top",
  delay = 300,
}: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const childRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!childRef.current) return;
    const rect = childRef.current.getBoundingClientRect();
    const tooltipHeight = 32;
    const tooltipPadding = 8;
    let top = 0;
    let left = 0;
    switch (position) {
      case "top":
        top = rect.top - tooltipHeight - tooltipPadding;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + tooltipPadding;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - tooltipPadding;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + tooltipPadding;
        break;
    }
    setCoords({ top, left });
  }, [position]);

  const showTooltip = useCallback(() => {
    if (hideTimeoutRef.current) { clearTimeout(hideTimeoutRef.current); hideTimeoutRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); }
    timeoutRef.current = setTimeout(() => { calculatePosition(); setIsVisible(true); }, delay);
  }, [calculatePosition, delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    hideTimeoutRef.current = setTimeout(() => { setIsVisible(false); }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const getTransform = () => {
    switch (position) {
      case "top": case "bottom": return "translateX(-50%)";
      case "left": return "translate(-100%, -50%)";
      case "right": return "translateY(-50%)";
      default: return "translateX(-50%)";
    }
  };

  if (!content) return <>{children}</>;

  const enhancedChild = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        ref: (node: HTMLElement | null) => {
          childRef.current = node;
          const originalRef = (children as any).ref;
          if (typeof originalRef === 'function') originalRef(node);
          else if (originalRef && typeof originalRef === 'object') originalRef.current = node;
        },
        onMouseEnter: (e: React.MouseEvent) => { showTooltip(); (children as React.ReactElement<any>).props.onMouseEnter?.(e); },
        onMouseLeave: (e: React.MouseEvent) => { hideTooltip(); (children as React.ReactElement<any>).props.onMouseLeave?.(e); },
        onFocus: (e: React.FocusEvent) => { showTooltip(); (children as React.ReactElement<any>).props.onFocus?.(e); },
        onBlur: (e: React.FocusEvent) => { hideTooltip(); (children as React.ReactElement<any>).props.onBlur?.(e); },
      })
    : children;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const tooltipElement = isVisible ? (
    <div
      role="tooltip"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      style={{ position: "fixed", top: coords.top, left: coords.left, transform: getTransform(), zIndex: 9999 }}
      className="px-3 py-1.5 text-xs font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 rounded-lg shadow-lg whitespace-pre-wrap break-words max-w-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div
        className={`absolute w-0 h-0 border-4 ${position === "top" ? "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100 border-x-transparent border-b-transparent" : ""}${position === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100 border-x-transparent border-t-transparent" : ""}${position === "left" ? "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100 border-y-transparent border-r-transparent" : ""}${position === "right" ? "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100 border-y-transparent border-l-transparent" : ""}`}
      />
      <span>{content}</span>
    </div>
  ) : null;

  return (
    <>
      {enhancedChild}
      {mounted && tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SimpleTooltip }

"use client";

import { ReactNode, useState, useRef, useEffect, useCallback, cloneElement, isValidElement } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    delay?: number;
}

export function Tooltip({
    content,
    children,
    position = "top",
    delay = 300,
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const childRef = useRef<HTMLElement | null>(null);

    // Handle client-side mounting for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Calculate tooltip position based on child element
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
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            calculatePosition();
            setIsVisible(true);
        }, delay);
    }, [calculatePosition, delay]);

    const hideTooltip = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Position transform based on placement
    const getTransform = () => {
        switch (position) {
            case "top":
            case "bottom":
                return "translateX(-50%)";
            case "left":
                return "translate(-100%, -50%)";
            case "right":
                return "translateY(-50%)";
            default:
                return "translateX(-50%)";
        }
    };

    if (!content) {
        return <>{children}</>;
    }

    // Clone the child element and add our event handlers and ref
    const enhancedChild = isValidElement(children)
        ? cloneElement(children as React.ReactElement<any>, {
            ref: (node: HTMLElement | null) => {
                childRef.current = node;
                // Preserve the original ref if it exists
                const originalRef = (children as any).ref;
                if (typeof originalRef === 'function') {
                    originalRef(node);
                } else if (originalRef && typeof originalRef === 'object') {
                    originalRef.current = node;
                }
            },
            onMouseEnter: (e: React.MouseEvent) => {
                showTooltip();
                // Call original handler if exists
                const originalHandler = (children as React.ReactElement<any>).props.onMouseEnter;
                if (originalHandler) originalHandler(e);
            },
            onMouseLeave: (e: React.MouseEvent) => {
                hideTooltip();
                const originalHandler = (children as React.ReactElement<any>).props.onMouseLeave;
                if (originalHandler) originalHandler(e);
            },
            onFocus: (e: React.FocusEvent) => {
                showTooltip();
                const originalHandler = (children as React.ReactElement<any>).props.onFocus;
                if (originalHandler) originalHandler(e);
            },
            onBlur: (e: React.FocusEvent) => {
                hideTooltip();
                const originalHandler = (children as React.ReactElement<any>).props.onBlur;
                if (originalHandler) originalHandler(e);
            },
        })
        : children;

    const tooltipElement = isVisible ? (
        <div
            role="tooltip"
            style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform: getTransform(),
                zIndex: 9999,
            }}
            className="px-3 py-1.5 text-xs font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 rounded-lg shadow-lg whitespace-nowrap max-w-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
            {/* Arrow */}
            <div
                className={`absolute w-0 h-0 border-4 ${position === "top" ? "top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100 border-x-transparent border-b-transparent" : ""
                    }${position === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100 border-x-transparent border-t-transparent" : ""
                    }${position === "left" ? "left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100 border-y-transparent border-r-transparent" : ""
                    }${position === "right" ? "right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100 border-y-transparent border-l-transparent" : ""
                    }`}
            />
            <span className="line-clamp-3">{content}</span>
        </div>
    ) : null;

    return (
        <>
            {enhancedChild}
            {mounted && tooltipElement && createPortal(tooltipElement, document.body)}
        </>
    );
}

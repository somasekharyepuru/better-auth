"use client";

import { useState, useRef, useEffect, ReactNode, cloneElement, isValidElement } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, ArrowRight } from "lucide-react";
import { LifeArea } from "@/lib/daymark-api";

interface ContextMenuProps {
    children: ReactNode;
    lifeAreas: LifeArea[];
    currentLifeAreaId: string | null;
    onMove: (targetLifeAreaId: string | null) => void;
    disabled?: boolean;
}

interface MenuPosition {
    x: number;
    y: number;
}

export function ContextMenu({
    children,
    lifeAreas,
    currentLifeAreaId,
    onMove,
    disabled = false,
}: ContextMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 });
    const [showSubmenu, setShowSubmenu] = useState(false);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter out current life area from options
    const availableLifeAreas = lifeAreas.filter(
        (area) => area.id !== currentLifeAreaId
    );

    // For SSR compatibility
    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle right-click on the wrapper
    const handleContextMenu = (e: React.MouseEvent) => {
        if (disabled || availableLifeAreas.length === 0) {
            return; // Let default context menu show
        }

        e.preventDefault();
        e.stopPropagation();

        const x = Math.min(e.clientX, window.innerWidth - 320);
        const y = Math.min(e.clientY, window.innerHeight - 200);

        setPosition({ x, y });
        setIsOpen(true);
        setShowSubmenu(false);
    };

    // Close on click outside or escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowSubmenu(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                setShowSubmenu(false);
            }
        };

        // Small delay to prevent immediate close
        const timer = setTimeout(() => {
            document.addEventListener("click", handleClick);
            document.addEventListener("contextmenu", handleClick);
            document.addEventListener("keydown", handleKeyDown);
        }, 10);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("click", handleClick);
            document.removeEventListener("contextmenu", handleClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleMove = (targetLifeAreaId: string) => {
        setIsOpen(false);
        setShowSubmenu(false);
        onMove(targetLifeAreaId);
    };

    // If disabled or no targets, just render children
    if (disabled || availableLifeAreas.length === 0) {
        return <>{children}</>;
    }

    const menu = isOpen && mounted ? createPortal(
        <div
            ref={menuRef}
            className="fixed z-[99999]"
            style={{ left: position.x, top: position.y }}
        >
            {/* Main menu */}
            <div className="min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-1 overflow-visible">
                <div
                    className="relative"
                    onMouseEnter={() => setShowSubmenu(true)}
                    onMouseLeave={() => setShowSubmenu(false)}
                >
                    <button
                        onClick={() => setShowSubmenu(!showSubmenu)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span>Move to</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Submenu - positioned to the right */}
                    {showSubmenu && (
                        <div
                            className="fixed z-[99999] min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-1"
                            style={{
                                left: position.x + 185,
                                top: position.y,
                            }}
                            onMouseEnter={() => setShowSubmenu(true)}
                            onMouseLeave={() => setShowSubmenu(false)}
                        >
                            {availableLifeAreas.map((area) => (
                                <button
                                    key={area.id}
                                    onClick={() => handleMove(area.id)}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-600"
                                        style={{ backgroundColor: area.color || '#9CA3AF' }}
                                    />
                                    <span>{area.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div onContextMenu={handleContextMenu}>
                {children}
            </div>
            {menu}
        </>
    );
}

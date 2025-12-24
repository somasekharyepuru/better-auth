"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import dayjs from "dayjs";

interface DatePickerProps {
    value: string; // YYYY-MM-DD format
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date", className = "" }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedDate = value ? new Date(value) : undefined;

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            onChange(dayjs(date).format("YYYY-MM-DD"));
            setIsOpen(false);
        }
    };

    const formattedValue = value ? dayjs(value).format("MMM D, YYYY") : "";

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
            >
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span className={value ? "" : "text-gray-400"}>
                    {formattedValue || placeholder}
                </span>
            </button>

            {/* Dropdown Calendar */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="date-picker-calendar bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 backdrop-blur-xl">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelect}
                            showOutsideDays
                            components={{
                                Chevron: ({ orientation }) =>
                                    orientation === "left"
                                        ? <ChevronLeft className="w-4 h-4" />
                                        : <ChevronRight className="w-4 h-4" />
                            }}
                            classNames={{
                                root: "date-picker-root",
                                months: "flex flex-col",
                                month: "space-y-4",
                                month_caption: "flex justify-center items-center h-10",
                                caption_label: "text-sm font-semibold text-gray-900 dark:text-white",
                                nav: "flex items-center justify-between absolute top-4 left-4 right-4",
                                button_previous: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300",
                                button_next: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300",
                                month_grid: "w-full border-collapse",
                                weekdays: "flex",
                                weekday: "w-9 h-9 flex items-center justify-center text-xs font-medium text-gray-400 dark:text-gray-500",
                                week: "flex",
                                day: "w-9 h-9 flex items-center justify-center",
                                day_button: "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer",
                                today: "ring-1 ring-gray-300 dark:ring-gray-600 rounded-lg",
                                selected: "!bg-gray-900 dark:!bg-white !text-white dark:!text-gray-900 rounded-lg font-semibold",
                                outside: "text-gray-300 dark:text-gray-600 hover:text-gray-400",
                                disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed hover:bg-transparent",
                                hidden: "invisible",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Icon-only variant for compact spaces
interface DatePickerIconProps {
    value: string;
    onChange: (date: string) => void;
    className?: string;
}

export function DatePickerIcon({ value, onChange, className = "" }: DatePickerIconProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedDate = value ? new Date(value) : undefined;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (date: Date | undefined) => {
        if (date) {
            onChange(dayjs(date).format("YYYY-MM-DD"));
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <Tooltip content="Pick a date">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <CalendarDays className="w-5 h-5" />
                </button>
            </Tooltip>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 z-50">
                    <div className="date-picker-calendar bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 backdrop-blur-xl">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleSelect}
                            showOutsideDays
                            components={{
                                Chevron: ({ orientation }) =>
                                    orientation === "left"
                                        ? <ChevronLeft className="w-4 h-4" />
                                        : <ChevronRight className="w-4 h-4" />
                            }}
                            classNames={{
                                root: "date-picker-root",
                                months: "flex flex-col",
                                month: "space-y-4",
                                month_caption: "flex justify-center items-center h-10",
                                caption_label: "text-sm font-semibold text-gray-900 dark:text-white",
                                nav: "flex items-center justify-between absolute top-4 left-4 right-4",
                                button_previous: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300",
                                button_next: "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300",
                                month_grid: "w-full border-collapse",
                                weekdays: "flex",
                                weekday: "w-9 h-9 flex items-center justify-center text-xs font-medium text-gray-400 dark:text-gray-500",
                                week: "flex",
                                day: "w-9 h-9 flex items-center justify-center",
                                day_button: "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer",
                                today: "ring-1 ring-gray-300 dark:ring-gray-600 rounded-lg",
                                selected: "!bg-gray-900 dark:!bg-white !text-white dark:!text-gray-900 rounded-lg font-semibold",
                                outside: "text-gray-300 dark:text-gray-600 hover:text-gray-400",
                                disabled: "text-gray-300 dark:text-gray-600 cursor-not-allowed hover:bg-transparent",
                                hidden: "invisible",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

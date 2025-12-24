"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
    value: string; // HH:mm format
    onChange: (time: string) => void;
    interval?: number; // minutes between options (default: 15)
    placeholder?: string;
    className?: string;
}

function generateTimeOptions(interval: number): string[] {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
            const h = String(hour).padStart(2, "0");
            const m = String(minute).padStart(2, "0");
            options.push(`${h}:${m}`);
        }
    }
    return options;
}

function formatTimeDisplay(time: string): string {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function TimePicker({
    value,
    onChange,
    interval = 15,
    placeholder = "Select time",
    className = ""
}: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const timeOptions = useMemo(() => generateTimeOptions(interval), [interval]);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!searchQuery) return timeOptions;
        const query = searchQuery.toLowerCase();
        return timeOptions.filter(time => {
            const display = formatTimeDisplay(time).toLowerCase();
            return display.includes(query) || time.includes(query);
        });
    }, [timeOptions, searchQuery]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll to selected time when opened
    useEffect(() => {
        if (isOpen && value && listRef.current) {
            const selectedIndex = timeOptions.indexOf(value);
            if (selectedIndex !== -1) {
                const itemHeight = 36; // approximate height of each item
                listRef.current.scrollTop = selectedIndex * itemHeight - 72;
            }
        }
    }, [isOpen, value, timeOptions]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
        setSearchQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsOpen(false);
            setSearchQuery("");
        } else if (e.key === "Enter" && filteredOptions.length > 0) {
            handleSelect(filteredOptions[0]);
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20 min-w-[120px]"
            >
                <Clock className="w-4 h-4 text-gray-400" />
                <span className={value ? "" : "text-gray-400"}>
                    {value ? formatTimeDisplay(value) : placeholder}
                </span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 animate-fade-in-scale">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden backdrop-blur-xl w-48">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type to filter..."
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
                            />
                        </div>

                        {/* Time Options List */}
                        <div
                            ref={listRef}
                            className="max-h-52 overflow-y-auto overscroll-contain"
                        >
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-gray-400 text-center">
                                    No matching times
                                </div>
                            ) : (
                                filteredOptions.map((time) => (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => handleSelect(time)}
                                        className={`w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center justify-between ${value === time
                                            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <span>{formatTimeDisplay(time)}</span>
                                        <span className="text-xs opacity-50">{time}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Compact inline variant for forms
interface TimePickerInlineProps {
    value: string;
    onChange: (time: string) => void;
    className?: string;
}

export function TimePickerInline({ value, onChange, className = "" }: TimePickerInlineProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value ? formatTimeDisplay(value) : "");
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const timeOptions = useMemo(() => generateTimeOptions(15), []);

    // Sync input with value prop
    useEffect(() => {
        if (value && !isOpen) {
            setInputValue(formatTimeDisplay(value));
        }
    }, [value, isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (value) setInputValue(formatTimeDisplay(value));
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    useEffect(() => {
        if (isOpen && value && listRef.current) {
            const selectedIndex = timeOptions.indexOf(value);
            if (selectedIndex !== -1) {
                const itemHeight = 32;
                listRef.current.scrollTop = selectedIndex * itemHeight - 64;
            }
        }
    }, [isOpen, value, timeOptions]);

    const handleSelect = (time: string) => {
        onChange(time);
        setInputValue(formatTimeDisplay(time));
        setIsOpen(false);
    };

    // Parse typed time and convert to HH:mm format
    const parseTimeInput = (input: string): string | null => {
        const cleaned = input.trim().toLowerCase();

        // Pattern: "9:30 am", "9:30am", "09:30", "9:30"
        const match1 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
        if (match1) {
            let hours = parseInt(match1[1], 10);
            const minutes = parseInt(match1[2], 10);
            const period = match1[3];
            if (period === 'pm' && hours !== 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
            if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
        }

        // Pattern: "9 am", "9pm"
        const match2 = cleaned.match(/^(\d{1,2})\s*(am|pm)$/i);
        if (match2) {
            let hours = parseInt(match2[1], 10);
            const period = match2[2];
            if (period === 'pm' && hours !== 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
            if (hours >= 0 && hours < 24) {
                return `${String(hours).padStart(2, '0')}:00`;
            }
        }

        return null;
    };

    const handleInputBlur = () => {
        const parsed = parseTimeInput(inputValue);
        if (parsed) {
            onChange(parsed);
            setInputValue(formatTimeDisplay(parsed));
        } else if (value) {
            setInputValue(formatTimeDisplay(value));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const parsed = parseTimeInput(inputValue);
            if (parsed) {
                onChange(parsed);
                setInputValue(formatTimeDisplay(parsed));
                setIsOpen(false);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            if (value) setInputValue(formatTimeDisplay(value));
        }
    };

    // Filter options based on input
    const filteredOptions = useMemo(() => {
        if (!inputValue || inputValue === formatTimeDisplay(value)) return timeOptions;
        const query = inputValue.toLowerCase();
        return timeOptions.filter(time => {
            const display = formatTimeDisplay(time).toLowerCase();
            return display.includes(query) || time.includes(query);
        });
    }, [timeOptions, inputValue, value]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder="--:--"
                className="w-24 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20 text-center"
            />

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-1 z-[100]">
                    <div
                        ref={listRef}
                        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden max-h-48 overflow-y-auto overscroll-contain w-32"
                    >
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-400 text-center">
                                Press Enter for custom time
                            </div>
                        ) : (
                            filteredOptions.slice(0, 20).map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(time);
                                    }}
                                    className={`w-full px-3 py-2 text-sm text-left transition-colors ${value === time
                                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    {formatTimeDisplay(time)}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

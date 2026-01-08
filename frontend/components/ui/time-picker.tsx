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

// Compact inline variant for forms - Simple Grid Design
interface TimePickerInlineProps {
    value: string;
    onChange: (time: string) => void;
    className?: string;
}

// Get nearest 15-min interval rounded up from current time
function getNearestTime(): { hour: number; minute: number; period: 'AM' | 'PM' } {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Round up to nearest 15 minutes
    const remainder = minutes % 15;
    if (remainder > 0) {
        minutes = minutes + (15 - remainder);
    }

    // Handle hour rollover
    if (minutes >= 60) {
        minutes = 0;
        hours = (hours + 1) % 24;
    }

    const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return { hour: hour12, minute: minutes, period };
}

export function TimePickerInline({ value, onChange, className = "" }: TimePickerInlineProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // Parse value to get hour, minute, period
    const parseValue = (val: string): { hour: number; minute: number; period: 'AM' | 'PM' } => {
        if (!val) return getNearestTime();
        const [hours, minutes] = val.split(':').map(Number);
        const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return { hour: hour12, minute: minutes, period };
    };

    const { hour, minute, period } = parseValue(value);
    const [selectedHour, setSelectedHour] = useState(hour);
    const [selectedMinute, setSelectedMinute] = useState(minute);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(period);

    const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const MINUTE_OPTIONS = [0, 15, 30, 45];

    // Sync state when value changes
    useEffect(() => {
        const { hour, minute, period } = parseValue(value);
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setSelectedPeriod(period);
    }, [value]);

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

    // Scroll to selected values when opened
    useEffect(() => {
        if (isOpen) {
            if (hourRef.current) {
                const idx = selectedHour - 1;
                hourRef.current.scrollTop = idx * 32;
            }
            if (minuteRef.current) {
                const idx = MINUTE_OPTIONS.indexOf(selectedMinute);
                minuteRef.current.scrollTop = idx * 32;
            }
        }
    }, [isOpen, selectedHour, selectedMinute]);

    const handleTimeChange = (newHour: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
        let hours24 = newHour;
        if (newPeriod === 'PM' && newHour !== 12) hours24 = newHour + 12;
        if (newPeriod === 'AM' && newHour === 12) hours24 = 0;
        const timeString = `${String(hours24).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
        onChange(timeString);
    };

    const handleHourClick = (h: number) => {
        setSelectedHour(h);
        handleTimeChange(h, selectedMinute, selectedPeriod);
    };

    const handleMinuteClick = (m: number) => {
        setSelectedMinute(m);
        handleTimeChange(selectedHour, m, selectedPeriod);
    };

    const handlePeriodClick = (p: 'AM' | 'PM') => {
        setSelectedPeriod(p);
        handleTimeChange(selectedHour, selectedMinute, p);
    };

    const displayTime = () => {
        const displayMinute = String(selectedMinute).padStart(2, '0');
        return `${selectedHour}:${displayMinute} ${selectedPeriod}`;
    };

    // Style to hide scrollbar
    const scrollStyle: React.CSSProperties = {
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Time Display Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20 min-w-[85px] justify-center"
            >
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="font-medium">{displayTime()}</span>
            </button>

            {/* Dropdown Picker - No animation */}
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-1 z-[100]">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden p-2">
                        {/* Scroll Columns */}
                        <div className="flex gap-1 mb-2">
                            {/* Hour Column */}
                            <div className="relative">
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-gray-100 dark:bg-gray-800 rounded-md pointer-events-none z-0" />
                                <div
                                    ref={hourRef}
                                    className="h-[96px] overflow-y-auto overflow-x-hidden scroll-smooth relative z-10 [&::-webkit-scrollbar]:hidden"
                                    style={scrollStyle}
                                >
                                    <div className="h-8" />
                                    {HOURS.map((h) => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => handleHourClick(h)}
                                            className={`w-10 h-8 flex items-center justify-center text-sm font-medium transition-colors ${selectedHour === h
                                                    ? 'text-gray-900 dark:text-white'
                                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                                }`}
                                            style={{ scrollSnapAlign: 'center' }}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                    <div className="h-8" />
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="flex items-center text-gray-300 dark:text-gray-600 text-sm font-light">:</div>

                            {/* Minute Column */}
                            <div className="relative">
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-gray-100 dark:bg-gray-800 rounded-md pointer-events-none z-0" />
                                <div
                                    ref={minuteRef}
                                    className="h-[96px] overflow-y-auto overflow-x-hidden scroll-smooth relative z-10 [&::-webkit-scrollbar]:hidden"
                                    style={scrollStyle}
                                >
                                    <div className="h-8" />
                                    {MINUTE_OPTIONS.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => handleMinuteClick(m)}
                                            className={`w-10 h-8 flex items-center justify-center text-sm font-medium transition-colors ${selectedMinute === m
                                                    ? 'text-gray-900 dark:text-white'
                                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                                }`}
                                            style={{ scrollSnapAlign: 'center' }}
                                        >
                                            {String(m).padStart(2, '0')}
                                        </button>
                                    ))}
                                    <div className="h-8" />
                                </div>
                            </div>
                        </div>

                        {/* AM/PM Toggle */}
                        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
                            <button
                                type="button"
                                onClick={() => handlePeriodClick('AM')}
                                className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${selectedPeriod === 'AM'
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                AM
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePeriodClick('PM')}
                                className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${selectedPeriod === 'PM'
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                PM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


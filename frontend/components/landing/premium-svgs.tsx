"use client";

import { useEffect, useState } from "react";

export function HeroConnections() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none [mask-image:radial-gradient(ellipse_at_center_center,white,transparent_80%)] opacity-60 dark:opacity-40">
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                    <linearGradient id="line-gradient-vertical" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>

                {/* Animated grid lines */}
                <g className="stroke-gray-900/5 dark:stroke-white/5" strokeWidth="1">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <line
                            key={`h-${i}`}
                            x1="0"
                            y1={`${i * 5}%`}
                            x2="100%"
                            y2={`${i * 5}%`}
                            className="opacity-0 animate-draw-line"
                            style={{
                                strokeDasharray: "1000",
                                strokeDashoffset: "1000",
                                animationDelay: `${i * 0.1}s`,
                                animationFillMode: "forwards",
                                animationDuration: "3s"
                            }}
                        />
                    ))}
                    {Array.from({ length: 30 }).map((_, i) => (
                        <line
                            key={`v-${i}`}
                            x1={`${i * 5}%`}
                            y1="0"
                            x2={`${i * 5}%`}
                            y2="100%"
                            className="opacity-0 animate-draw-line"
                            style={{
                                strokeDasharray: "1000",
                                strokeDashoffset: "1000",
                                animationDelay: `${i * 0.15}s`,
                                animationFillMode: "forwards",
                                animationDuration: "3s"
                            }}
                        />
                    ))}
                </g>

                {/* Glowing comet lines moving horizontally */}
                <line x1="0" y1="20%" x2="400" y2="20%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-comet" style={{ animationDelay: "1s", opacity: 0 }} />
                <line x1="0" y1="60%" x2="400" y2="60%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-comet" style={{ animationDelay: "4s", opacity: 0 }} />
                <line x1="0" y1="85%" x2="400" y2="85%" stroke="url(#line-gradient)" strokeWidth="2" className="animate-comet" style={{ animationDelay: "7s", opacity: 0 }} />

                {/* Glowing comet lines moving vertically */}
                <line x1="30%" y1="0" x2="30%" y2="400" stroke="url(#line-gradient-vertical)" strokeWidth="2" className="animate-comet-vertical" style={{ animationDelay: "2.5s", opacity: 0 }} />
                <line x1="75%" y1="0" x2="75%" y2="400" stroke="url(#line-gradient-vertical)" strokeWidth="2" className="animate-comet-vertical" style={{ animationDelay: "6s", opacity: 0 }} />
            </svg>
        </div>
    );
}

export function AnimatedOrb({ color = "#818cf8", size = 400, delay = "0s", left = "50%", top = "50%" }) {
    return (
        <div style={{ left, top, animationDelay: delay }} className="absolute -translate-x-1/2 -translate-y-1/2 -z-10 mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-30 pointer-events-none custom-animate-float">
            <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <radialGradient id={`orb-grad-${color.replace('#', '')}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
                <circle cx="50" cy="50" r="50" fill={`url(#orb-grad-${color.replace('#', '')})`} className="animate-pulse-slow" style={{ transformOrigin: 'center', animationDelay: delay }} />
            </svg>
        </div>
    );
}

export function FeatureIconRing() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <rect
                    x="2"
                    y="2"
                    width="96"
                    height="96"
                    rx="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-indigo-500/0 group-hover:text-indigo-500/50 transition-colors duration-500"
                    strokeDasharray="20 10"
                    style={{
                        animation: "spin-border 10s linear infinite"
                    }}
                />
            </svg>
        </div>
    )
}

export function SeparatorLine() {
    return (
        <div className="w-full h-px relative overflow-hidden flex justify-center py-12 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent w-full h-px top-1/2 -translate-y-1/2"></div>
            <div className="absolute w-[20%] h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent top-1/2 -translate-y-1/2 animate-comet left-[-20%]"></div>
        </div>
    )
}

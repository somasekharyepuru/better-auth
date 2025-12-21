/**
 * Application Configuration Constants
 * 
 * This file contains all the text content and configuration for the application.
 * Designed for an Apple-style landing page with calm, minimal aesthetics.
 */
export const APP_CONFIG = {
    // App Identity
    name: "Daymark",
    shortName: "D",
    tagline: "Your day, designed.",
    logo: "/logo.png",

    // Navigation & Actions
    navigation: {
        login: "Sign In",
        signup: "Get Started",
    },

    // Hero Section
    hero: {
        headline: "A better way to plan your day",
        subheadline: "Tasks, notes, habits, and daily focus — designed to work together.",
        primaryCta: "Join the waitlist",
        secondaryCta: "Learn more",
    },

    // Philosophy Section
    philosophy: {
        headline: "Designed for clarity",
        description: "Most productivity tools are cluttered, noisy, and complex. They promise to help you do more, but end up demanding your attention instead. Daymark is intentionally simple — designed to help you see what matters today, do your best work, and move on with your life.",
    },

    // Feature Highlights
    features: [
        {
            title: "Your day, at a glance",
            description: "Daily priorities, tasks, and notes in one calm view.",
        },
        {
            title: "Focus without distraction",
            description: "Only what you need. Nothing you don't.",
        },
        {
            title: "Reflect and improve",
            description: "End each day with clarity and intention.",
        },
    ],

    // How It Fits Into Your Life
    lifestyle: {
        statements: [
            "Plan in minutes.",
            "Work with focus.",
            "End the day clear.",
        ],
    },

    // Who It's For
    audience: {
        headline: "Who it's for",
        list: ["Developers", "Founders", "Knowledge workers", "Students"],
    },

    // Final CTA
    finalCta: {
        headline: "Make every day count.",
        subtext: "Join the early access list.",
        buttonText: "Get early access",
    },

    // Footer
    footer: {
        copyright: "© 2024",
        tagline: "Calm productivity, by design.",
        links: [
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
        ],
    },

    // Auth Layout
    authLayout: {
        title: "Welcome to Daymark",
        subtitle: "Sign in to access your personalized productivity dashboard",
        tagline: "Your productivity, simplified",
    },

    // Metadata
    metadata: {
        title: "Daymark — A better way to plan your day",
        description: "A calm, distraction-free productivity app that helps you plan your day, focus on top priorities, capture notes, track habits, and reflect daily.",
    },
} as const;

// Export individual constants for convenience
export const APP_NAME = APP_CONFIG.name;
export const APP_SHORT_NAME = APP_CONFIG.shortName;

// Helper function to get page title with app name
export const getPageTitle = (pageTitle?: string) => {
    return pageTitle ? `${pageTitle} — ${APP_CONFIG.name}` : APP_CONFIG.metadata.title;
};
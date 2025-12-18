/**
 * Application Configuration Constants
 * 
 * This file contains all the text content and configuration for the application.
 * Update the values here to change the app name, descriptions, and other text content
 * throughout the application.
 * 
 * Usage:
 * import { APP_CONFIG, APP_NAME } from '@/config/app.constants';
 * 
 * Examples:
 * - App name: APP_CONFIG.name or APP_NAME
 * - Navigation text: APP_CONFIG.navigation.login
 * - Hero title: APP_CONFIG.hero.title.main
 * - Feature descriptions: APP_CONFIG.features.security.description
 */
export const APP_CONFIG = {
    // App Identity
    name: "Personal Productivity",
    shortName: "PP",

    // Navigation & Actions
    navigation: {
        login: "Sign In",
        signup: "Get Started",
    },

    // Hero Section
    hero: {
        title: {
            main: "Boost your productivity.",
            subtitle: "Achieve more daily."
        },
        description: "Transform your daily workflow with smart task management, goal tracking, and productivity insights that help you accomplish more.",
        footnote: "1"
    },

    // Features Section
    features: {
        security: {
            title: "Secure & Private",
            description: "Your personal data stays protected with enterprise-grade security, 2FA authentication, and encrypted storage."
        },
        performance: {
            title: "Smart Organization",
            description: "Intelligent task prioritization, automated scheduling, and seamless workflow management to maximize your efficiency."
        },
        management: {
            title: "Goal Tracking",
            description: "Set meaningful goals, track progress with visual insights, and celebrate achievements with comprehensive analytics."
        }
    },

    // Footer
    footer: {
        disclaimer: "Personal productivity platform designed to help you achieve your goals. Privacy-focused and secure."
    },

    // Auth Layout
    authLayout: {
        title: "Welcome to Personal Productivity",
        subtitle: "Sign in to access your personalized productivity dashboard and tools",
        tagline: "Your productivity, amplified"
    },

    // Metadata
    metadata: {
        title: "Personal Productivity - Smart Task & Goal Management",
        description: "Boost your productivity with intelligent task management, goal tracking, and workflow optimization tools"
    }
} as const;

// Export individual constants for convenience
export const APP_NAME = APP_CONFIG.name;
export const APP_SHORT_NAME = APP_CONFIG.shortName;

// Helper function to get page title with app name
export const getPageTitle = (pageTitle?: string) => {
    return pageTitle ? `${pageTitle} - ${APP_CONFIG.name}` : APP_CONFIG.metadata.title;
};
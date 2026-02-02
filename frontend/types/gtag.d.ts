// Type definitions for Google Analytics gtag.js

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GtagConfig {
    page_path?: string;
    page_title?: string;
    page_location?: string;
    anonymize_ip?: boolean;
    cookie_flags?: string;
    send_page_view?: boolean;
    [key: string]: any;
}

export interface GtagEvent {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
}

export interface GtagConsent {
    analytics_storage?: "granted" | "denied";
    ad_storage?: "granted" | "denied";
    ad_user_data?: "granted" | "denied";
    ad_personalization?: "granted" | "denied";
    [key: string]: any;
}

export type GtagCommand = "config" | "event" | "js" | "set" | "consent";

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (
            command: GtagCommand,
            targetId: string | Date,
            config?: GtagConfig | GtagEvent | GtagConsent
        ) => void;
    }
}

// This export is needed to make this file a module
export { };

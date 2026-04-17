import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PerformancePolyfill } from "@/components/runtime/performance-polyfill";
import { ToastProvider } from "@/components/ui/toast";
import { APP_CONFIG } from "@/config/app.constants";

export const metadata: Metadata = {
    title: APP_CONFIG.metadata.title,
    description: APP_CONFIG.metadata.description,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <GoogleAnalytics />
            </head>
            <body suppressHydrationWarning>
                <PerformancePolyfill />
                <QueryProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <Toaster />
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}

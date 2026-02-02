"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Inner component that uses useSearchParams (requires Suspense boundary)
function GoogleAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) {
      return;
    }

    // Track page view on route change
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  // Only render in production and when GA ID is configured
  if (process.env.NODE_ENV !== "production" || !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onError={(e) => {
          console.error("Failed to load Google Analytics script:", e);
        }}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsTracker />
      </Suspense>
    </>
  );
}

// Helper function to track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
) {
  if (
    process.env.NODE_ENV !== "production" ||
    typeof window === "undefined" ||
    !window.gtag
  ) {
    return;
  }

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Helper function to track page views (useful for manual tracking)
export function trackPageView(url: string) {
  if (
    process.env.NODE_ENV !== "production" ||
    typeof window === "undefined" ||
    !window.gtag ||
    !GA_MEASUREMENT_ID
  ) {
    return;
  }

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

// Helper to update consent (for cookie consent banners)
export function updateAnalyticsConsent(hasConsent: boolean) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("consent", "update", {
    analytics_storage: hasConsent ? "granted" : "denied",
  });
}

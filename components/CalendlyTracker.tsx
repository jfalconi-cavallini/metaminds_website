"use client";

import { useEffect } from "react";

// ─── REPLACE THESE TWO VALUES ────────────────────────────────────────────────
// Google Ads → Goals → Conversions → [your conversion] → Tag setup → "Install manually"
// You'll see  gtag('event','conversion',{send_to:'AW-XXXXXXXXX/LABEL'})
const GOOGLE_ADS_CONVERSION_ID    = "AW-XXXXXXXXX";           // e.g. AW-123456789
const GOOGLE_ADS_CONVERSION_LABEL = "XXXXXXXXXXXXXXXXXXXX";   // e.g. AbCdEfGhIjKlMnOp
// ─────────────────────────────────────────────────────────────────────────────

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
    }
}

export default function CalendlyTracker() {
    useEffect(() => {
        function handleMessage(e: MessageEvent) {
            if (e.data?.event !== "calendly.event_scheduled") return;

            // 1. Google Ads conversion
            window.gtag?.("event", "conversion", {
                send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_CONVERSION_LABEL}`,
            });

            // 2. GA4 generate_lead
            window.gtag?.("event", "generate_lead", {
                event_category: "consultation",
                event_label: "calendly_booking",
                value: 1,
            });

            // 3. GTM dataLayer push (works if GTM is added later)
            window.dataLayer = window.dataLayer ?? [];
            window.dataLayer.push({ event: "calendly_scheduled" });
        }

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    return null;
}

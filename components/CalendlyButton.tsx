"use client";

import { siteData } from "@/lib/data";

declare global {
    interface Window {
        Calendly?: {
            initPopupWidget: (opts: { url: string }) => void;
        };
    }
}

interface Props {
    className?: string;
    children: React.ReactNode;
}

export default function CalendlyButton({ className, children }: Props) {
    function open() {
        const url = siteData.hero?.formUrl;
        if (url) window.Calendly?.initPopupWidget({ url });
    }

    return (
        <button type="button" onClick={open} className={className}>
            {children}
        </button>
    );
}

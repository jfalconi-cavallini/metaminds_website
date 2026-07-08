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
    url?: string;
}

export default function CalendlyButton({ className, children, url }: Props) {
    function open() {
        const target = url ?? siteData.hero?.formUrl;
        if (target) window.Calendly?.initPopupWidget({ url: target });
    }

    return (
        <button type="button" onClick={open} className={className}>
            {children}
        </button>
    );
}

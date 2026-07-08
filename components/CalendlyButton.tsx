"use client";

import { useRouter } from "next/navigation";
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
    url?: string; // if provided, opens Calendly popup; otherwise navigates to /consultation
}

export default function CalendlyButton({ className, children, url }: Props) {
    const router = useRouter();

    function open() {
        if (url) {
            // Package-specific booking — open popup directly
            window.Calendly?.initPopupWidget({ url });
        } else {
            // Main consultation CTA — go to landing page
            router.push("/consultation");
        }
    }

    return (
        <button type="button" onClick={open} className={className}>
            {children}
        </button>
    );
}

"use client";

import Link from "next/link";

interface Props {
    className?: string;
    children: React.ReactNode;
    url?: string; // if provided, opens that Calendly URL in a new tab; otherwise links to /consultation
}

export default function CalendlyButton({ className, children, url }: Props) {
    if (url) {
        return (
            <button
                type="button"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                className={className}
            >
                {children}
            </button>
        );
    }

    return (
        <Link href="/consultation" className={className}>
            {children}
        </Link>
    );
}

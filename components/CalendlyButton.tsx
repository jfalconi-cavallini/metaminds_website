"use client";

import { useRouter } from "next/navigation";

interface Props {
    className?: string;
    children: React.ReactNode;
    url?: string; // if provided, opens that Calendly URL in a new tab; otherwise navigates to /consultation
}

export default function CalendlyButton({ className, children, url }: Props) {
    const router = useRouter();

    function open() {
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            router.push("/consultation");
        }
    }

    return (
        <button type="button" onClick={open} className={className}>
            {children}
        </button>
    );
}

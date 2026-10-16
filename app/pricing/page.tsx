"use client";

import { useEffect } from "react";

/** Old /pricing bookmarks 404'd — send families to homepage tiers. */
export default function PricingRedirect() {
    useEffect(() => {
        window.location.replace("/#pricing");
    }, []);
    return null;
}

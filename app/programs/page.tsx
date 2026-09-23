"use client";

import { useEffect } from "react";

/** Old /programs bookmarks 404'd — send families to homepage What We Teach. */
export default function ProgramsRedirect() {
    useEffect(() => {
        window.location.replace("/#programs");
    }, []);
    return null;
}

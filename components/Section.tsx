"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionProps {
    id?: string;
    children: ReactNode;
    className?: string;
    containerClassName?: string;
}

export default function Section({
    id,
    children,
    className,
    containerClassName,
}: SectionProps) {
    return (
        <section
            id={id}
            className={cn("py-16 md:py-24 scroll-mt-20", className)}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={cn(
                    "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    containerClassName
                )}
            >
                {children}
            </motion.div>
        </section>
    );
}
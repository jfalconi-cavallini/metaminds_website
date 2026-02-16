"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import { Check } from "lucide-react";

export default function TrustBar() {
    return (
        <section className="bg-white py-8 border-y border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center items-center gap-6 md:gap-12"
                >
                    {siteData.trustBar.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <span className="text-gray-700 font-medium">{item}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
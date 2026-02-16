"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function CTA() {
    return (
        <Section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-3xl mx-auto"
            >
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    {siteData.cta.headline}
                </h2>

                <p className="text-xl text-indigo-100 mb-10">
                    {siteData.cta.subheadline}
                </p>

                <a href={siteData.hero.formUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-indigo-600 px-10 py-5 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-2xl">
                    {siteData.cta.buttonText}
                </a>
            </motion.div>
        </Section>
    );
}
"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function Programs() {
    return (
        <Section id="programs" className="bg-gray-50">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Divisions Designed for Growth
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Students are placed by age and skill level—then challenged to level up.
                </p>

                <p className="mt-3 text-sm text-gray-500 max-w-3xl mx-auto">
                    🏆 Each division competes in its own tournament bracket • ⬆️ Advancement is possible throughout the summer
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {siteData.tracks.map((track, idx) => (
                    <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                        className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-gray-100"
                    >
                        <div className="inline-block bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                            {track.ageRange}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {track.name}
                        </h3>

                        <p className="text-gray-600 mb-6">{track.description}</p>

                        <ul className="space-y-3">
                            {track.highlights.map((highlight, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-indigo-600 text-xl">•</span>
                                    <span className="text-gray-700 text-sm">{highlight}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
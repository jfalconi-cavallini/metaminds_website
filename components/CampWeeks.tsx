"use client";

import { motion } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function CampWeeks() {
    return (
        <Section id="weeks" className="bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Summer 2026 Weeks
                </h2>
                <p className="text-lg text-gray-600">
                    12 weeks of adventure—each with a unique, cutting-edge theme.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {siteData.campWeeks.map((week, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-indigo-300 group"
                    >
                        <div className="flex items-start gap-4">
                            <Calendar className="w-8 h-8 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-lg mb-1">
                                    {week.dates}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <p className="font-semibold text-indigo-600 text-sm">
                                        {week.theme}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {week.description}
                                </p>
                                <p className="text-xs text-green-600 font-medium capitalize mt-3">
                                    {week.status}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-12">
                <a href={siteData.hero.formUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all hover:scale-105">
                    Register for a Week
                </a>
            </div>
        </Section>
    );
}
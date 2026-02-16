"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";
import { Calendar, Code, Wrench, Trophy } from "lucide-react";
import { useState } from "react";

export default function Themes() {
    const [expandedTheme, setExpandedTheme] = useState<number | null>(null);

    return (
        <Section id="themes" className="bg-white">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    12 Unique Weekly Themes
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Each week features a different cutting-edge theme—from AI and space exploration to smart cities and mind-controlled robots. Every child experiences something completely new.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {siteData.themes.map((theme, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:border-indigo-300 transition-all hover:shadow-xl group cursor-pointer"
                        onClick={() => setExpandedTheme(expandedTheme === idx ? null : idx)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-5xl group-hover:scale-110 transition-transform">
                                {theme.icon}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                <Calendar className="w-3 h-3" />
                                {theme.weekDates}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                            {theme.name}
                        </h3>

                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            {theme.description}
                        </p>

                        {expandedTheme === idx && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-gray-200 pt-4 mt-4 space-y-4"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Code className="w-4 h-4 text-indigo-600" />
                                        <span className="font-semibold text-sm text-gray-900">Skills Learned</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {theme.skills.map((skill, i) => (
                                            <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wrench className="w-4 h-4 text-indigo-600" />
                                        <span className="font-semibold text-sm text-gray-900">Build Projects</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {theme.projects.map((project, i) => (
                                            <li key={i} className="text-xs text-gray-600 flex items-center gap-2">
                                                <span className="w-1 h-1 bg-indigo-600 rounded-full" />
                                                {project}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        <button className="text-sm text-indigo-600 font-semibold mt-2 group-hover:underline">
                            {expandedTheme === idx ? "Show less" : "Learn more →"}
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 rounded-2xl border border-indigo-200">
                    <Trophy className="w-6 h-6 text-indigo-600" />
                    <p className="text-gray-700">
                        <span className="font-bold text-indigo-600">Pro Tip:</span> Students can attend multiple weeks to explore different themes!
                    </p>
                </div>
            </div>
        </Section>
    );
}
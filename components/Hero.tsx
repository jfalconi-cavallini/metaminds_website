"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Trophy, Sparkles, ChevronDown, Award } from "lucide-react";
import { siteData } from "@/lib/data";

export default function Hero() {
    return (
        <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden">
            {/* Gradient Orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.22, 0.12] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 -left-24 w-[420px] h-[420px] md:w-[520px] md:h-[520px] bg-indigo-400 rounded-full mix-blend-multiply blur-3xl"
                />
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-10 -right-24 w-[420px] h-[420px] md:w-[520px] md:h-[520px] bg-purple-400 rounded-full mix-blend-multiply blur-3xl"
                />
            </div>

            {/* Main */}
            <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                {/* Make hero content naturally centered without huge padding */}
                <div className="min-h-screen flex flex-col justify-center pt-24 pb-16 md:pt-28">
                    {/* Text */}
                    <div className="text-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full shadow-md border border-indigo-100 mb-6"
                        >
                            <Award className="w-5 h-5 text-indigo-600" />
                            <span className="text-indigo-900 font-semibold text-xs sm:text-sm tracking-wide">
                                Summer 2026 • Premium STEM Experience
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-4 leading-[1.05] tracking-tight"
                        >
                            Build. Code.{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                Compete.
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium"
                        >
                            {siteData.hero.subheadline}
                        </motion.p>

                        {/* Key Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="mt-6 bg-white/70 backdrop-blur-md border border-indigo-100 rounded-2xl px-6 sm:px-8 py-4 max-w-3xl mx-auto shadow-sm"
                        >
                            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm sm:text-base">
                                <span className="text-slate-700 font-semibold">Ages 6–14</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-700 font-semibold">9 AM – 3 PM</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-700 font-semibold">Week-Long Camps</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-indigo-600 font-bold">From $450/week</span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-orange-600 font-bold text-sm flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Limited Founding Family Spots - Save $75/week
                                </p>
                            </div>
                        </motion.div>

                        {/* Feature Pills */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.55 }}
                            className="mt-6 flex flex-wrap gap-3 justify-center"
                        >
                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm border border-slate-200">
                                <Users className="w-5 h-5 text-indigo-600" />
                                <span className="text-slate-700 font-semibold text-sm">8:1 Student Ratio</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm border border-slate-200">
                                <Trophy className="w-5 h-5 text-indigo-600" />
                                <span className="text-slate-700 font-semibold text-sm">Daily Competitions</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm border border-slate-200">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                <span className="text-slate-700 font-semibold text-sm">All Levels Welcome</span>
                            </div>
                        </motion.div>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                            className="mt-7 flex flex-col sm:flex-row gap-3 justify-center"
                        >
                            <a
                                href={siteData.hero.formUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl"
                            >
                                Reserve Your Spot
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href="#weeks"
                                className="inline-flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm text-indigo-700 px-8 py-3.5 rounded-xl font-bold text-base hover:bg-white transition-all shadow-md border border-slate-200 hover:border-indigo-300"
                            >
                                Explore Curriculum
                            </a>
                        </motion.div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="mt-16"
                    >
                        <ChevronDown className="w-7 h-7 text-slate-400 mx-auto" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
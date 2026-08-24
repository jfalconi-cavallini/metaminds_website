"use client";

import { motion } from "framer-motion";
import { ArrowRight, Award, Users, Lightbulb } from "lucide-react";
import { siteData } from "@/lib/data";
import TutorCarousel from "./TutorCarousel";
import CalendlyButton from "./CalendlyButton";

export default function HeroTutoring() {
    return (
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-20 pb-10">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

            <div className="relative max-w-7xl mx-auto px-6 w-full">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col justify-center"
                    >
                        <div className="mb-5">
                            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">PERSONALIZED. EFFECTIVE. RESULTS.</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                            Unlock Your<br />
                            Child&apos;s Potential<br />
                            in <span className="text-blue-400">STEM</span>
                        </h1>

                        <p className="text-base md:text-lg text-blue-100 mb-7 leading-relaxed max-w-xl">
                            Expert tutoring in SAT/ACT, Math, Coding, and STEM from degreed professionals who work in their fields every day — not grad students or career tutors.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-8">
                            <CalendlyButton className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                Book Free Consultation
                                <ArrowRight className="w-4 h-4" />
                            </CalendlyButton>
                            <a
                                href="#programs"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/30 text-white font-bold rounded-lg hover:bg-white/20 transition-colors text-sm"
                            >
                                See Our Programs
                            </a>
                        </div>

                        {/* Credibility Callouts */}
                        <div className="grid grid-cols-3 gap-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="flex flex-col items-center text-center p-3 bg-white/5 backdrop-blur rounded-lg border border-white/10"
                            >
                                <Award className="w-5 h-5 text-green-400 mb-2" />
                                <div className="text-xs font-bold text-white">Proven Results</div>
                                <div className="text-xs text-blue-200 mt-0.5">+200 SAT pts avg</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="flex flex-col items-center text-center p-3 bg-white/5 backdrop-blur rounded-lg border border-white/10"
                            >
                                <Users className="w-5 h-5 text-green-400 mb-2" />
                                <div className="text-xs font-bold text-white">Expert Tutors</div>
                                <div className="text-xs text-blue-200 mt-0.5">Active professionals</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="flex flex-col items-center text-center p-3 bg-white/5 backdrop-blur rounded-lg border border-white/10"
                            >
                                <Lightbulb className="w-5 h-5 text-green-400 mb-2" />
                                <div className="text-xs font-bold text-white">1-on-1 Sessions</div>
                                <div className="text-xs text-blue-200 mt-0.5">Personalized</div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right: Tutor Carousel */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex items-center justify-center"
                    >
                        <TutorCarousel />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
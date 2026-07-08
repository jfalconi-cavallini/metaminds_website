"use client";

import { motion } from "framer-motion";
import { ArrowRight, Award, Users, Lightbulb } from "lucide-react";
import { siteData } from "@/lib/data";
import TutorCarousel from "./TutorCarousel";
import CalendlyButton from "./CalendlyButton";

export default function HeroTutoring() {
    return (
        <section className="relative min-h-[100vh] flex items-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-20 pb-16">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />

            <div className="relative max-w-7xl mx-auto px-6 w-full">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100vh-120px)]">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col justify-center"
                    >
                        <div className="mb-8">
                            <span className="text-sm font-bold text-blue-300 uppercase tracking-widest">PERSONALIZED. EFFECTIVE. RESULTS.</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
                            Unlock Your<br />
                            Child&apos;s Potential<br />
                            in <span className="text-blue-400">STEM</span>
                        </h1>

                        <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-xl">
                            Expert tutoring in SAT/ACT, Math, Coding, Robotics, and 3D Design from UC graduates.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-16">
                            <CalendlyButton className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-base">
                                Book Free Consultation
                                <ArrowRight className="w-5 h-5" />
                            </CalendlyButton>
                            <a
                                href="#programs"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-lg hover:bg-white/20 transition-colors text-base"
                            >
                                See Our Programs
                            </a>
                        </div>

                        {/* Credibility Callouts */}
                        <div className="grid grid-cols-3 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="flex flex-col items-center text-center p-4 bg-white/5 backdrop-blur rounded-lg border border-white/10"
                            >
                                <Award className="w-7 h-7 text-green-400 mb-3" />
                                <div className="text-sm font-bold text-white">Proven Results</div>
                                <div className="text-xs text-blue-200 mt-1">+200 SAT points avg</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="flex flex-col items-center text-center p-4 bg-white/5 backdrop-blur rounded-lg border border-white/10"
                            >
                                <Users className="w-7 h-7 text-green-400 mb-3" />
                                <div className="text-sm font-bold text-white">Expert Tutors</div>
                                <div className="text-xs text-blue-200 mt-1">UC graduates</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                                className="flex flex-col items-center text-center p-4 bg-white/5 backdrop-blur rounded-lg border border-white/10"
                            >
                                <Lightbulb className="w-7 h-7 text-green-400 mb-3" />
                                <div className="text-sm font-bold text-white">1-on-1 Sessions</div>
                                <div className="text-xs text-blue-200 mt-1">Personalized approach</div>
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
"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";
import Image from "next/image";
import { GraduationCap, Sparkles } from "lucide-react";

export default function Founders() {
    return (
        <Section
            id="founders"
            className="relative bg-white !pt-16 !pb-20 overflow-hidden"
        >

            {/* ── Header ── */}
            <div className="relative z-10 text-center mb-12">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Our Team
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight leading-tight px-4"
                >
                    Meet the{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Founders
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.16 }}
                    className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4"
                >
                    Real Engineers. Real Curriculum. Real Teaching.
                </motion.p>
            </div>

            {/* ── Cards ── */}
            <div className="relative z-10 grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
                {siteData.founders.map((founder, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + idx * 0.15, duration: 0.5 }}
                        className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Card gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />

                        {/* Mesh overlay */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
                                                  radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
                            }}
                        />

                        {/* Decorative ring accents */}
                        <div className="absolute -top-10 -right-10 w-44 h-44 border border-white/10 rounded-full" />
                        <div className="absolute -top-6 -right-6 w-28 h-28 border border-white/10 rounded-full" />
                        <div className="absolute -bottom-8 -left-8 w-36 h-36 border border-white/10 rounded-full" />

                        {/* Content */}
                        <div className="relative z-10 p-5 sm:p-6">

                            {/* Avatar + identity */}
                            <div className="flex items-center gap-3 sm:gap-4 mb-5">
                                <div className="relative flex-shrink-0">
                                    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden ring-2 ring-white/30 shadow-xl">
                                        <Image
                                            src={founder.image}
                                            alt={founder.name}
                                            width={72}
                                            height={72}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-violet-600 shadow" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                                        {founder.name}
                                    </h3>
                                    <p className="text-violet-200 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mt-0.5">
                                        {founder.title}
                                    </p>
                                </div>
                            </div>

                            {/* Bio */}
                            <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed mb-5 border-l-2 border-white/20 pl-3">
                                {founder.bio}
                            </p>

                            {/* Credentials */}
                            <div className="space-y-2">
                                <p className="text-white/40 text-[10px] font-bold tracking-[0.15em] uppercase mb-2">
                                    Credentials
                                </p>
                                {founder.credentials.map((credential, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 rounded-lg px-3 py-2.5 transition-colors duration-200"
                                    >
                                        <GraduationCap className="w-4 h-4 text-violet-300 flex-shrink-0 mt-0.5" />
                                        <span className="text-white/85 text-xs sm:text-sm font-medium leading-snug">
                                            {credential}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Optional: Trust statement */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-center mt-12 px-4"
            >
                <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto">
                    Combined <span className="font-bold text-indigo-600">20+ years</span> of engineering experience teaching the next generation of innovators.
                </p>
            </motion.div>
        </Section>
    );
}
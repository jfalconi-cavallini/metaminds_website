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
            className="relative bg-white !pt-12 !pb-16 overflow-hidden"
        >
            {/* Header */}
            <div className="relative z-10 text-center mb-10">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
                >
                    <Sparkles className="w-4 h-4" />
                    Our Team
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight leading-tight px-4"
                >
                    Meet the{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Instructors
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4"
                >
                    Real Engineers. Real Curriculum. Real Teaching.
                </motion.p>
            </div>

            {/* Cards - 3 per row on desktop, 2 on tablet, 1 on mobile */}
            <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-7xl mx-auto px-4">
                {siteData.founders.map((founder, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.08, duration: 0.4 }}
                        className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Card gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" />

                        {/* Mesh overlay */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 50%),
                                                  radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
                            }}
                        />

                        {/* Decorative ring accents - smaller */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 border border-white/10 rounded-full" />
                        <div className="absolute -top-4 -right-4 w-20 h-20 border border-white/10 rounded-full" />

                        {/* Content */}
                        <div className="relative z-10 p-4 sm:p-5">

                            {/* Avatar + Identity */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden ring-2 ring-white/30 shadow-xl">
                                        <Image
                                            src={founder.image}
                                            alt={founder.name}
                                            width={64}
                                            height={64}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-purple-600 shadow" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                                        {founder.name}
                                    </h3>
                                    <p className="text-purple-200 text-[10px] sm:text-xs font-bold tracking-wider uppercase mt-0.5">
                                        {founder.title}
                                    </p>
                                </div>
                            </div>

                            {/* Bio - more compact */}
                            <p className="text-indigo-100/90 text-xs sm:text-sm leading-relaxed mb-4 border-l-2 border-white/20 pl-2.5 line-clamp-3">
                                {founder.bio}
                            </p>

                            {/* Credentials - compact */}
                            <div className="space-y-1.5">
                                <p className="text-white/40 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mb-1.5">
                                    Credentials
                                </p>
                                {founder.credentials.slice(0, 3).map((credential, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 rounded-lg px-2.5 py-2 transition-colors duration-200"
                                    >
                                        <GraduationCap className="w-3.5 h-3.5 text-purple-300 flex-shrink-0 mt-0.5" />
                                        <span className="text-white/85 text-[11px] sm:text-xs font-medium leading-tight">
                                            {credential}
                                        </span>
                                    </div>
                                ))}
                                {founder.credentials.length > 3 && (
                                    <p className="text-white/50 text-[10px] italic pl-2.5 mt-1">
                                        +{founder.credentials.length - 3} more
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Trust Statement */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center mt-10 px-4"
            >
                <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                    Combined <span className="font-bold text-indigo-600">20+ years</span> of engineering experience teaching the next generation of innovators.
                </p>
            </motion.div>
        </Section>
    );
}
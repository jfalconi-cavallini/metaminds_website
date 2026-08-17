"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Section from "./Section";
import { siteData } from "@/lib/data";

export default function FoundingTeam() {
    const tutors = siteData.founders || [];

    return (
        <section id="team" className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 scroll-mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-14">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 mb-3"
                    >
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Founding Team</span>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-black text-white mb-4"
                    >
                        Meet the Tutors Who Built This
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-base text-blue-200 max-w-2xl mx-auto leading-relaxed"
                    >
                        MetaMinds was built by working engineers and scientists who believe exceptional teaching requires both deep subject mastery and genuine care for students. Every tutor is selected for subject expertise, communication, and fit.
                    </motion.p>
                </div>

                {/* Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {tutors.map((tutor, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.08 }}
                            className="bg-white/6 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-blue-400/40 transition-all group"
                        >
                            {/* Founding badge */}
                            <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-1.5 flex items-center gap-1.5">
                                <Star className="w-3 h-3 text-white fill-white flex-shrink-0" />
                                <span className="text-xs font-bold text-white uppercase tracking-wide">Founding Tutor</span>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <img
                                        src={tutor.image}
                                        alt={tutor.name}
                                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-blue-400/30 group-hover:border-blue-400/60 transition-colors"
                                    />
                                    <div>
                                        <h3 className="font-bold text-white text-base leading-tight">{tutor.name}</h3>
                                        <p className="text-blue-400 text-xs font-semibold mt-1 leading-snug">{tutor.title}</p>
                                    </div>
                                </div>

                                <p className="text-slate-300 text-sm leading-relaxed mb-4">{tutor.bio}</p>

                                <div className="space-y-1.5 pt-3 border-t border-white/10">
                                    {tutor.credentials?.slice(0, 3).map((cred, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                            <span className="text-blue-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                                            <span>{cred}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer quote */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="mt-14 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto text-center"
                >
                    <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">Our Mission</p>
                    <p className="text-white text-lg md:text-xl font-semibold leading-relaxed">
                        "We built MetaMinds because we were tired of watching students pay $200/hr to companies that pocket the difference.
                        Here, your tutor is your partner — and every dollar goes toward your results."
                    </p>
                    <p className="text-slate-400 text-sm mt-4">— The MetaMinds Founding Team</p>
                </motion.div>
            </div>
        </section>
    );
}

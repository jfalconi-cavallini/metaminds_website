"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Section from "./Section";
import { siteData } from "@/lib/data";

export default function FoundingTeam() {
    const tutors = siteData.founders || [];

    return (
        <Section id="team" className="bg-white py-20">
            <div className="text-center mb-14">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 mb-3"
                >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Founding Team</span>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-black text-gray-900 mb-4"
                >
                    Meet the Tutors Who Built This
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
                >
                    MetaMinds was founded by working engineers and scientists — not investors or executives.
                    Every tutor you meet is a founding member who built this platform because they believe
                    students deserve better than the corporate tutoring model.
                </motion.p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {tutors.map((tutor, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 overflow-hidden hover:shadow-lg transition-shadow group"
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
                                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border-2 border-blue-100"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base leading-tight">{tutor.name}</h3>
                                    <p className="text-blue-600 text-xs font-semibold mt-0.5">{tutor.title}</p>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed mb-4">{tutor.bio}</p>

                            <div className="space-y-1.5">
                                {tutor.credentials?.slice(0, 3).map((cred, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                        <span className="text-green-500 font-bold flex-shrink-0 mt-0.5">✓</span>
                                        <span>{cred}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-12 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 max-w-4xl mx-auto text-center"
            >
                <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">Our Promise</p>
                <p className="text-white text-xl font-bold leading-relaxed">
                    "We built MetaMinds because we were tired of watching students pay $200/hr to companies that
                    pocket the difference. Here, your tutor is your partner — and every dollar goes toward your results."
                </p>
                <p className="text-blue-300 text-sm mt-4">— The MetaMinds Founding Team</p>
            </motion.div>
        </Section>
    );
}

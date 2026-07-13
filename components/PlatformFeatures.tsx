"use client";

import { motion } from "framer-motion";
import { Brain, BookOpen, MessageSquare, Users, Rocket, Shield } from "lucide-react";
import Section from "./Section";
import { siteData } from "@/lib/data";

const iconMap: Record<string, React.ElementType> = {
    Brain,
    BookOpen,
    MessageSquare,
    Users,
    Rocket,
    Shield,
};

export default function PlatformFeatures() {
    const { platform } = siteData;

    return (
        <Section id="platform" className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20">
            <div className="text-center mb-14">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-block mb-3"
                >
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Beyond the Session</span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-black text-white mb-4"
                >
                    {platform.headline}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-base text-blue-200 max-w-2xl mx-auto leading-relaxed"
                >
                    {platform.subheadline}
                </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                {platform.features.map((feature, idx) => {
                    const Icon = iconMap[feature.icon] ?? Brain;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.08 }}
                            className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-blue-500/40 transition-all group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                                <Icon className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-blue-200 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-12 text-center"
            >
                <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-5 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-blue-200 font-medium">Platform access included with every tutoring package</span>
                </div>
            </motion.div>
        </Section>
    );
}

"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, Zap, Award } from "lucide-react";
import Section from "./Section";

const reasons = [
    {
        icon: Award,
        title: "Proven Results",
        description: "Real students. Real improvements. Real success.",
    },
    {
        icon: Users,
        title: "Experienced Tutor",
        description: "1000+ hours of tutoring experience.",
    },
    {
        icon: TrendingUp,
        title: "Personalized Approach",
        description: "Every student learns differently.",
    },
    {
        icon: Zap,
        title: "Flexible Schedule",
        description: "Sessions that fit your family's needs.",
    },
];

export default function WhyMetaMinds() {
    return (
        <Section className="bg-gray-50">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black text-gray-900 mb-6"
                >
                    Why Parents Choose MetaMinds
                </motion.h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {reasons.map((reason, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-2xl p-8 border border-gray-200 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-4 mx-auto">
                            <reason.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{reason.title}</h3>
                        <p className="text-sm text-gray-600">{reason.description}</p>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
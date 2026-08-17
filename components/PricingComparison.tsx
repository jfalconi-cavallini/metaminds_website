"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import Section from "./Section";
import CalendlyButton from "./CalendlyButton";

const tiers = [
    {
        name: "Premium Mentoring",
        tag: "SAT/ACT · AP Courses · Advanced Coursework",
        description:
            "Our most experienced educators — graduates, engineers, and specialized instructors with deep subject mastery and proven teaching track records.",
        rate: "From $70/hr",
        rateNote: "Single session through 20-hour packages",
    },
    {
        name: "College Mentor",
        tag: "High School · Middle School · Elementary",
        description:
            "High-achieving college students, carefully selected and supervised by MetaMinds. The full MetaMinds system — session notes, homework, parent updates, skill tracking — at a more accessible rate.",
        rate: "From $50/hr",
        rateNote: "Single session through 20-hour packages",
    },
    {
        name: "Junior College Mentor",
        tag: "Foundational Support · Homework Help · Younger Students",
        description:
            "Focused support for foundational learning, homework help, and younger students. A natural entry point for building consistent study habits from an early age.",
        rate: null,
        rateNote: "Book a consultation to discuss rates",
    },
] as const;

const includedInAll = [
    "Session notes after every session",
    "Homework assignments with feedback",
    "Parent progress updates",
    "Skill tracking in the student portal",
    "1-on-1 sessions only — no group classes",
];

export default function PricingComparison() {
    return (
        <Section id="pricing" className="bg-slate-50 py-20">
            <div className="text-center mb-14">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-block mb-3"
                >
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                        Mentoring Tiers
                    </span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-black text-gray-900 mb-4"
                >
                    Choose the right level of support.
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
                >
                    Every tier runs on the same MetaMinds system. The difference is tutor
                    experience level and the type of student each tier is built for.
                </motion.p>
            </div>

            {/* Tier cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
                {tiers.map((tier, idx) => (
                    <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col"
                    >
                        <div className="mb-5">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                                {tier.tag}
                            </p>
                            <h3 className="text-lg font-black text-gray-900 mb-3">{tier.name}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{tier.description}</p>
                        </div>

                        <div className="mt-auto pt-5 border-t border-gray-100">
                            {tier.rate ? (
                                <div className="mb-4">
                                    <span className="text-2xl font-black text-gray-900">{tier.rate}</span>
                                    <p className="text-xs text-gray-400 mt-1">{tier.rateNote}</p>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700">{tier.rateNote}</p>
                                </div>
                            )}
                            <CalendlyButton className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                                Book Free Consultation
                                <ArrowRight className="w-3.5 h-3.5" />
                            </CalendlyButton>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* What every tier includes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
                    Included in every tier
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                    {includedInAll.map((item) => (
                        <div key={item} className="flex items-start gap-2.5">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">{item}</p>
                        </div>
                    ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-5">
                    Not sure which tier is right? Book a free consultation and we&apos;ll help you find the best fit.
                </p>
            </motion.div>
        </Section>
    );
}

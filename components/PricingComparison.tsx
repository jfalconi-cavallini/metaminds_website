"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import Section from "./Section";
import CalendlyButton from "./CalendlyButton";

const tiers = [
    {
        name: "Premium Mentoring",
        description:
            "An experienced tutor and mentor, one on one online, building a plan around your child's goals.",
    },
    {
        name: "College Mentor Tutoring",
        description:
            "The same MetaMinds system with a college mentor who was recently in your child's shoes.",
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
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-black text-gray-900"
                >
                    Two ways to work with us
                </motion.h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
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
                            <h3 className="text-lg font-black text-gray-900 mb-3">{tier.name}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{tier.description}</p>
                        </div>

                        <div className="mt-auto pt-5 border-t border-gray-100">
                            <CalendlyButton className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                                Book a free consultation
                                <ArrowRight className="w-3.5 h-3.5" />
                            </CalendlyButton>
                        </div>
                    </motion.div>
                ))}
            </div>

            <p className="text-center text-sm text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                Packages of 1, 4, or 8 hours. Book a free consultation and we&apos;ll help you choose.
            </p>

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

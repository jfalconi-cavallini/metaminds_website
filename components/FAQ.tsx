"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, CheckCircle } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null); // First question open by default

    return (
        <Section id="faq" className="bg-white">
            {/* Header */}
            <div className="text-center mb-16 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                >
                    <HelpCircle className="w-4 h-4" />
                    Got Questions?
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                >
                    Parents Ask.{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        We Answer
                    </span>
                    .
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                >
                    Everything you need to know about enrollment, schedules, safety, and what makes
                    our camp special. Can't find your answer? <a href={`mailto:${siteData.brand?.email || 'metamindsstemacademy@gmail.com'}`} className="text-indigo-600 font-bold hover:underline">Email us</a>.
                </motion.p>
            </div>

            {/* FAQ Items */}
            <div className="max-w-4xl mx-auto px-4 space-y-4">
                {siteData.faqs.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className={`group rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isOpen
                                ? "border-indigo-400 shadow-xl shadow-indigo-100/50"
                                : "border-gray-200 hover:border-indigo-300 shadow-md hover:shadow-lg"
                                }`}
                        >
                            {/* Question Button */}
                            <button
                                type="button"
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                className={`w-full flex justify-between items-start gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left transition-all duration-300 ${isOpen
                                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600"
                                    : "bg-white group-hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                    {/* Question Number/Icon */}
                                    <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-base transition-all duration-300 ${isOpen
                                        ? "bg-white/20 text-white"
                                        : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200"
                                        }`}>
                                        {idx + 1}
                                    </div>

                                    {/* Question Text */}
                                    <span className={`font-bold text-base sm:text-lg leading-tight pt-1 ${isOpen ? "text-white" : "text-gray-900"
                                        }`}>
                                        {faq.question}
                                    </span>
                                </div>

                                {/* Chevron */}
                                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen
                                    ? "bg-white/20"
                                    : "bg-indigo-50 border-2 border-indigo-100 group-hover:border-indigo-200"
                                    }`}>
                                    <ChevronDown
                                        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : "text-indigo-600"
                                            }`}
                                    />
                                </div>
                            </button>

                            {/* Answer */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
                                        className="overflow-hidden bg-gradient-to-br from-gray-50 to-white"
                                    >
                                        <div className="px-6 sm:px-8 py-5 sm:py-6 border-t-2 border-indigo-100">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mt-16 px-4"
            >
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 sm:p-10 max-w-3xl mx-auto border-2 border-indigo-200">
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
                        Still Have Questions?
                    </h3>
                    <p className="text-gray-700 mb-6 text-sm sm:text-base leading-relaxed">
                        We're here to help! Reach out and we'll get back to you within 24 hours.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={`mailto:${siteData.brand?.email || 'metamindsstemacademy@gmail.com'}`}
                            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-base sm:text-lg border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all"
                        >
                            📧 Email Us
                        </a>
                        <a
                            href={siteData.hero.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition-all hover:scale-105"
                        >
                            Reserve Your Spot
                        </a>
                    </div>
                </div>
            </motion.div>
        </Section>
    );
}
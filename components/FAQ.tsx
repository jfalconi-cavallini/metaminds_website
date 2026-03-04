"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <Section id="faq" className="relative bg-white !pt-10 !pb-12 overflow-hidden min-h-screen">

            {/* ── Header ── */}
            <div className="relative z-10 text-center mb-10">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
                >
                    Got Questions?
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight leading-tight"
                >
                    Frequently Asked{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Questions
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.16 }}
                    className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed"
                >
                    Everything parents want to know about camp.
                </motion.p>
            </div>

            {/* ── FAQ Items ── */}
            <div className="relative z-10 max-w-3xl mx-auto space-y-3 px-1">
                {siteData.faqs.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                            className={`rounded-xl overflow-hidden border transition-all duration-300 ${isOpen
                                ? "border-indigo-300 shadow-md shadow-indigo-100"
                                : "border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                className={`w-full flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 text-left transition-colors duration-200 ${isOpen
                                    ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700"
                                    : "bg-white hover:bg-slate-50"
                                    }`}
                            >
                                <span className={`font-semibold text-sm sm:text-base pr-4 ${isOpen ? "text-white" : "text-slate-800"}`}>
                                    {faq.question}
                                </span>
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen
                                    ? "bg-white/20"
                                    : "bg-indigo-50 border border-indigo-100"
                                    }`}>
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : "text-indigo-600"
                                            }`}
                                    />
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.28, ease: "easeInOut" }}
                                        className="overflow-hidden bg-white"
                                    >
                                        <div className="px-5 py-4 sm:px-6 sm:py-5 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-indigo-100">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </Section>
    );
}
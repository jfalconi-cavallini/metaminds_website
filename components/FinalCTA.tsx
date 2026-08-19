"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import CalendlyButton from "./CalendlyButton";

export default function FinalCTA() {
    return (
        <section className="py-16 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Let&apos;s find the right tutor for your kid.</h2>
                        <p className="text-base text-blue-100 mb-7 max-w-xl mx-auto">
                            Book a free consultation — we&apos;ll talk through goals, fit, and which tier makes sense.
                        </p>
                        <CalendlyButton className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">
                            Book Free Consultation
                            <ArrowRight className="w-4 h-4" />
                        </CalendlyButton>
                        <p className="text-blue-200 text-xs mt-5">No commitment. Just a conversation.</p>
                    </motion.div>
                </div>
        </section>
    );
}
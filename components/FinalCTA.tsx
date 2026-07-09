"use client";

import { motion } from "framer-motion";
import { ArrowRight, Gift } from "lucide-react";
import { siteData } from "@/lib/data";
import CalendlyButton from "./CalendlyButton";

export default function FinalCTA() {
    const referral = siteData.referral;

    return (
        <>
            {/* Referral Banner */}
            <section className="py-10 bg-amber-50 border-y border-amber-200">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                            <Gift className="w-3.5 h-3.5" />
                            {referral.badge}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">{referral.headline}</h2>
                        <p className="text-sm text-gray-600 max-w-xl mx-auto">{referral.description}</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to Get Started?</h2>
                        <p className="text-base text-blue-100 mb-7 max-w-xl mx-auto">
                            Book a free consultation to discuss your goals and how we can help.
                        </p>
                        <CalendlyButton className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">
                            Book Free Consultation
                            <ArrowRight className="w-4 h-4" />
                        </CalendlyButton>
                        <p className="text-blue-200 text-xs mt-5">No commitment. Just a conversation.</p>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
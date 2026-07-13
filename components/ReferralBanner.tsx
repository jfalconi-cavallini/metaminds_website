"use client";

import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { siteData } from "@/lib/data";
import CalendlyButton from "./CalendlyButton";

export default function ReferralBanner() {
    const { referral } = siteData;

    return (
        <section className="py-12 bg-amber-50 border-y border-amber-200">
            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-1.5">
                                {referral.badge}
                            </div>
                            <h3 className="text-lg font-black text-gray-900">{referral.headline}</h3>
                            <p className="text-sm text-gray-600 mt-1 max-w-lg">{referral.description}</p>
                        </div>
                    </div>
                    <CalendlyButton className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors text-sm whitespace-nowrap">
                        Get Started <ArrowRight className="w-4 h-4" />
                    </CalendlyButton>
                </motion.div>
            </div>
        </section>
    );
}

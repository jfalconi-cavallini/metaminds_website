"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { siteData } from "@/lib/data";

export default function FinalCTA() {
    return (
        <section className="py-24 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                        Ready to Get Started?
                    </h2>

                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        Book a free consultation to discuss your goals and how we can help.
                    </p>

                    <a
                        href={siteData.hero?.formUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-lg"
                    >
                        Book Free Consultation
                        <ArrowRight className="w-5 h-5" />
                    </a>

                    <div className="mt-12 text-center">
                        <p className="text-blue-200 text-sm">
                            No commitment. Just a conversation.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
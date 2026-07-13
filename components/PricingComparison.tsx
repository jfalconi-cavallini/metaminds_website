"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight, TrendingDown, ExternalLink } from "lucide-react";
import Section from "./Section";
import { siteData } from "@/lib/data";
import CalendlyButton from "./CalendlyButton";

export default function PricingComparison() {
    const { pricing } = siteData;

    return (
        <Section id="pricing" className="bg-slate-50 py-20">
            <div className="text-center mb-14">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-block mb-3"
                >
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Transparent Pricing</span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-black text-gray-900 mb-4"
                >
                    Elite Tutoring.<br className="sm:hidden" /> Student-First Pricing.
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
                >
                    Same caliber of degreed, working professionals. No corporate middleman — so you pay your tutor, not a sales team.
                </motion.p>
            </div>

            {/* Packages */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-16">
                {pricing.packages.map((pkg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.08 }}
                        className={`relative rounded-2xl border p-6 flex flex-col ${
                            pkg.badge === "Best Value"
                                ? "bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600 text-white shadow-xl scale-[1.03]"
                                : pkg.badge === "Most Popular"
                                ? "bg-white border-blue-300 shadow-md"
                                : "bg-white border-gray-200 shadow-sm"
                        }`}
                    >
                        {pkg.badge && (
                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                pkg.badge === "Best Value"
                                    ? "bg-amber-400 text-amber-900"
                                    : "bg-blue-600 text-white"
                            }`}>
                                {pkg.badge}
                            </div>
                        )}

                        <div className="mb-4">
                            <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${pkg.badge === "Best Value" ? "text-blue-300" : "text-gray-500"}`}>
                                {pkg.name}
                            </p>
                            <div className="flex items-end gap-1.5">
                                <span className={`text-3xl font-black ${pkg.badge === "Best Value" ? "text-white" : "text-gray-900"}`}>
                                    {pkg.price}
                                </span>
                                <span className={`text-sm font-medium mb-1 ${pkg.badge === "Best Value" ? "text-blue-300" : "text-gray-400"}`}>
                                    / {pkg.duration}
                                </span>
                            </div>
                            <p className={`text-sm font-bold mt-1 ${pkg.badge === "Best Value" ? "text-amber-400" : "text-blue-600"}`}>
                                {pkg.pricePerHour}
                            </p>
                        </div>

                        <p className={`text-sm leading-relaxed flex-1 ${pkg.badge === "Best Value" ? "text-blue-200" : "text-gray-600"}`}>
                            {pkg.description}
                        </p>

                        <CalendlyButton className={`mt-5 w-full py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
                            pkg.badge === "Best Value"
                                ? "bg-amber-400 text-amber-900 hover:bg-amber-300"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}>
                            Get Started <ArrowRight className="w-3.5 h-3.5" />
                        </CalendlyButton>
                    </motion.div>
                ))}
            </div>

            {/* Competitor Comparison */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 mb-4">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold text-red-700">Up to 75% less than the competition</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900">See for Yourself</h3>
                    <p className="text-sm text-gray-500 mt-1">Click any competitor to see their published pricing.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Table header */}
                    <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 px-6 py-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Rate</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Direct to Tutor?</div>
                    </div>

                    {/* Competitors */}
                    {pricing.competitors.map((comp, idx) => (
                        <div key={idx} className="grid grid-cols-3 px-6 py-4 border-b border-gray-100 items-center hover:bg-red-50/30 transition-colors">
                            <div>
                                <a
                                    href={comp.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-gray-700 text-sm hover:text-blue-600 transition-colors group"
                                >
                                    {comp.name}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                                <p className="text-xs text-gray-400 mt-0.5">{comp.type}</p>
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">{comp.pricePerHour}</span>
                            </div>
                            <div className="flex justify-end">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                        </div>
                    ))}

                    {/* MetaMinds */}
                    <div className="grid grid-cols-3 px-6 py-5 bg-blue-50 border-t-2 border-blue-300 items-center">
                        <div>
                            <p className="font-black text-blue-900 text-sm">MetaMinds STEM Academy</p>
                            <p className="text-xs text-blue-600 font-semibold mt-0.5">Tutor-built. Student-first.</p>
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-black text-green-700 bg-green-100 px-2.5 py-1 rounded-full">From $50/hr</span>
                        </div>
                        <div className="flex justify-end">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Differentiators */}
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                    {pricing.differentiators.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">{point}</p>
                        </div>
                    ))}
                </div>

                <p className="text-center text-xs text-gray-400 mt-5">
                    Competitor rates based on publicly listed pricing. MetaMinds 20-hr package rate shown. Single sessions from $70/hr.
                </p>
            </motion.div>
        </Section>
    );
}

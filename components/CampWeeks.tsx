"use client";

import { motion } from "framer-motion";
import { Calendar, Sparkles, Users, Zap, CheckCircle, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";
import { useState } from "react";

export default function CampWeeks() {
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

    return (
        <Section id="weeks" className="bg-white">
            {/* Header */}
            <div className="text-center mb-16 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                >
                    <Calendar className="w-4 h-4" />
                    Summer 2026
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                >
                    12 Themed{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Adventure Weeks
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6"
                >
                    Each week features a unique cutting-edge theme—from AI and robotics to space exploration and smart cities.
                    Attend one week or all summer!
                </motion.p>

                {/* Urgency Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full shadow-lg"
                >
                    <Zap className="w-5 h-5" />
                    <span className="font-bold text-sm sm:text-base">
                        Most weeks 40% full • Early registration recommended
                    </span>
                </motion.div>
            </div>

            {/* Weeks Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 mb-12">
                {siteData.campWeeks.map((week, idx) => {
                    // Find matching theme from siteData.themes if it exists
                    const matchingTheme = siteData.themes?.find(t => t.weekDates === week.dates);

                    // Determine status styling
                    const getStatusStyle = (status: string) => {
                        const lower = status.toLowerCase();
                        if (lower.includes('full') || lower.includes('sold out')) {
                            return {
                                bg: 'bg-red-100',
                                text: 'text-red-700',
                                border: 'border-red-300',
                                badge: 'Sold Out',
                                icon: '🔴'
                            };
                        }
                        if (lower.includes('filling') || lower.includes('few')) {
                            return {
                                bg: 'bg-orange-100',
                                text: 'text-orange-700',
                                border: 'border-orange-300',
                                badge: 'Filling Fast',
                                icon: '⚠️'
                            };
                        }
                        return {
                            bg: 'bg-green-100',
                            text: 'text-green-700',
                            border: 'border-green-300',
                            badge: 'Spots Available',
                            icon: '✅'
                        };
                    };

                    const statusStyle = getStatusStyle(week.status);
                    const isSoldOut = statusStyle.badge === 'Sold Out';
                    const isExpanded = expandedWeek === idx;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${isSoldOut ? 'border-gray-300 opacity-75' : 'border-indigo-200 hover:border-indigo-400'
                                } ${isSoldOut ? '' : 'hover:-translate-y-1'}`}
                        >
                            <div className="p-6 sm:p-8">
                                {/* Icon, Dates & Status */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-2xl sm:text-3xl">
                                                {matchingTheme?.icon || '🤖'}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                                                {week.dates}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-gray-500" />
                                                <span className="text-xs text-gray-600 font-medium">
                                                    5 Days • 9-3 PM
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status badge - moved to top right, better positioned */}
                                    <div className={`flex-shrink-0 ${statusStyle.bg} ${statusStyle.text} px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${statusStyle.border} shadow-sm whitespace-nowrap`}>
                                        {statusStyle.icon} {statusStyle.badge}
                                    </div>
                                </div>

                                {/* Theme */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            Weekly Theme
                                        </span>
                                    </div>
                                    <h4 className="text-base sm:text-lg font-bold text-indigo-600 leading-tight">
                                        {week.theme}
                                    </h4>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    {week.description}
                                </p>

                                {/* Expandable Details */}
                                {matchingTheme && isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="border-t border-gray-200 pt-4 mb-4 space-y-3"
                                    >
                                        {/* Skills */}
                                        {matchingTheme.skills && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-700 mb-2">Skills Learned</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {matchingTheme.skills.map((skill, i) => (
                                                        <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Projects */}
                                        {matchingTheme.projects && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-700 mb-2">Build Projects</p>
                                                <ul className="space-y-1">
                                                    {matchingTheme.projects.map((project, i) => (
                                                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                            <span className="w-1 h-1 bg-indigo-600 rounded-full mt-1.5 flex-shrink-0" />
                                                            <span>{project}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Expand/Details button */}
                                {matchingTheme && (
                                    <button
                                        onClick={() => setExpandedWeek(isExpanded ? null : idx)}
                                        className="text-xs sm:text-sm text-indigo-600 font-semibold mb-4 flex items-center gap-1 hover:underline"
                                    >
                                        {isExpanded ? (
                                            <>Hide Details <ChevronUp className="w-4 h-4" /></>
                                        ) : (
                                            <>Show Skills & Projects <ChevronDown className="w-4 h-4" /></>
                                        )}
                                    </button>
                                )}

                                {/* What's Included */}
                                <div className="space-y-1.5 mb-4 bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-bold text-gray-700 mb-2">
                                        Every Week Includes
                                    </p>
                                    {[
                                        "Robot to take home",
                                        "3D printed design",
                                        "Custom coded project"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                            <span className="text-xs text-gray-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                {isSoldOut ? (
                                    <button
                                        disabled
                                        className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-xl font-bold text-sm cursor-not-allowed"
                                    >
                                        Week Full - Waitlist Only
                                    </button>
                                ) : (
                                    <a
                                        href={siteData.hero.formUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group/btn w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        Reserve This Week
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto px-4"
            >
                {/* Pricing reminder */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 mb-8 border border-indigo-200">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
                                Multi-Week Discount Available
                            </h3>
                            <p className="text-gray-700">
                                Register for multiple weeks and save! See <a href="#pricing" className="text-indigo-600 font-bold hover:underline">pricing details</a> for our early bird and founding family rates.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ callout */}
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        Questions about which week is right for your child?
                    </p>
                    <a
                        href="#faq"
                        className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
                    >
                        Check our FAQ
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </motion.div>
        </Section>
    );
}
"use client";

import { motion } from "framer-motion";
import { Clock, Coffee, Code, Trophy, Lightbulb, Users, Zap, Award } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function DaySchedule() {
    // Enhanced schedule with icons and descriptions
    const eliteSchedule = [
        {
            time: "9:00 AM",
            activity: "Morning Launch",
            description: "Team huddle, project briefing, and daily challenge reveal",
            icon: Coffee,
            color: "from-amber-500 to-orange-500"
        },
        {
            time: "9:30 AM",
            activity: "Core Build Session",
            description: "Hands-on robotics construction, programming, or 3D design work",
            icon: Code,
            color: "from-blue-500 to-indigo-600"
        },
        {
            time: "11:00 AM",
            activity: "Skill Workshop",
            description: "Focused learning: advanced coding, CAD design, or electronics",
            icon: Lightbulb,
            color: "from-purple-500 to-violet-600"
        },
        {
            time: "12:00 PM",
            activity: "Lunch & Free Build",
            description: "Supervised break with optional creative building time",
            icon: Users,
            color: "from-emerald-500 to-teal-600"
        },
        {
            time: "1:00 PM",
            activity: "Project Development",
            description: "Work on take-home projects: robots, games, or 3D prints",
            icon: Zap,
            color: "from-cyan-500 to-blue-500"
        },
        {
            time: "2:00 PM",
            activity: "Tournament & Showcase",
            description: "Daily competitions, project demos, and peer feedback",
            icon: Trophy,
            color: "from-yellow-500 to-amber-600"
        },
        {
            time: "2:45 PM",
            activity: "Wrap-Up & Awards",
            description: "Daily achievements, tomorrow's preview, and take-home progress",
            icon: Award,
            color: "from-pink-500 to-rose-600"
        }
    ];

    return (
        <Section id="schedule" className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241, 0.2) 1px, transparent 0)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-16 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-indigo-200 text-indigo-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                    >
                        <Clock className="w-4 h-4" />
                        Daily Schedule
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                    >
                        Every Minute{" "}
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Maximized
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-4"
                    >
                        Six hours of structured, hands-on learning designed to keep students engaged,
                        challenged, and creating from start to finish.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg"
                    >
                        <Clock className="w-4 h-4" />
                        9:00 AM – 3:00 PM, Monday – Friday
                    </motion.div>
                </div>

                {/* Timeline */}
                <div className="max-w-5xl mx-auto px-4">
                    <div className="relative">
                        {/* Vertical line for desktop */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 -translate-x-1/2" />

                        {/* Schedule Items */}
                        <div className="space-y-8">
                            {eliteSchedule.map((item, idx) => {
                                const Icon = item.icon;
                                const isEven = idx % 2 === 0;

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                        className={`relative md:grid md:grid-cols-2 md:gap-8 items-center ${isEven ? '' : 'md:flex-row-reverse'
                                            }`}
                                    >
                                        {/* Time badge - Desktop centered */}
                                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                            <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${item.color} shadow-xl`}>
                                                <Icon className="w-8 h-8 text-white" />
                                            </div>
                                        </div>

                                        {/* Content card - Left side on even, right on odd */}
                                        <div className={`${isEven ? 'md:col-start-1 md:text-right' : 'md:col-start-2 md:text-left'}`}>
                                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-indigo-100">
                                                {/* Mobile icon */}
                                                <div className="md:hidden mb-4">
                                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${item.color}`}>
                                                        <Icon className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>

                                                {/* Time */}
                                                <div className="flex items-center gap-2 mb-3 md:justify-start">
                                                    <Clock className="w-5 h-5 text-indigo-600 md:hidden" />
                                                    <span className="text-lg sm:text-xl font-black text-indigo-600">
                                                        {item.time}
                                                    </span>
                                                </div>

                                                {/* Activity */}
                                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                                                    {item.activity}
                                                </h3>

                                                {/* Description */}
                                                <p className="text-gray-600 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Empty space for opposite side on desktop */}
                                        <div className={`hidden md:block ${isEven ? 'md:col-start-2' : 'md:col-start-1'}`} />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4"
                >
                    {[
                        { stat: "6 Hours", label: "Active Learning Daily" },
                        { stat: "Zero", label: "Screen Time Lectures" },
                        { stat: "100%", label: "Hands-On Projects" },
                        { stat: "Daily", label: "Tournament Action" }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center border border-indigo-200 shadow-lg"
                        >
                            <div className="text-2xl sm:text-3xl font-black text-indigo-600 mb-1">
                                {item.stat}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-700 font-semibold">
                                {item.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-12 px-4"
                >
                    <p className="text-gray-700 text-base sm:text-lg max-w-2xl mx-auto mb-6">
                        No passive learning. No wasted time. Just <span className="font-bold text-indigo-600">pure, hands-on innovation</span> from bell to bell.
                    </p>
                </motion.div>
            </div>
        </Section>
    );
}
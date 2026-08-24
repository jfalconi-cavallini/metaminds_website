"use client";

import { motion } from "framer-motion";
import { Video, Users, Zap, Check, Clock, Trophy, ArrowRight } from "lucide-react";
import Section from "./Section";
import CalendlyButton from "./CalendlyButton";

export default function Mentoring() {
    const packages = [
        {
            name: "Single Session",
            price: "$70",
            duration: "1 Hour",
            sessions: "1 Session",
            icon: <Video className="w-8 h-8" />,
            description: "Perfect for trying out 1-on-1 mentoring or getting help with a specific project",
            features: [
                "One 60-minute session",
                "Personalized instruction",
                "Work on your own project",
                "Screen sharing & live coding",
                "Follow-up resources",
            ],
            calendlyUrl: "https://calendly.com/metamindsstemacademy/1-on-1-mentoring-1hr",
            popular: false,
            gradient: "from-blue-500 to-cyan-500",
            bgGradient: "from-blue-50 to-cyan-50",
        },
        {
            name: "4-Hour Package",
            price: "$260",
            duration: "4 Hours Total",
            sessions: "4 Sessions",
            icon: <Users className="w-8 h-8" />,
            description: "Best for learning a new skill or completing a multi-week project",
            features: [
                "Four 60-minute sessions",
                "Structured learning path",
                "Project milestone tracking",
                "Between-session support",
                "Certificate of completion",
            ],
            calendlyUrl: "https://calendly.com/metamindsstemacademy/4-hour-mentoring-package-payment-required",
            popular: true,
            gradient: "from-indigo-500 to-purple-500",
            bgGradient: "from-indigo-50 to-purple-50",
            savings: "Save $20",
        },
        {
            name: "8-Hour Package",
            price: "$480",
            duration: "8 Hours Total",
            sessions: "8 Sessions",
            icon: <Trophy className="w-8 h-8" />,
            description: "Ultimate package for mastering complex topics or building advanced projects",
            features: [
                "Eight 60-minute sessions",
                "Deep-dive curriculum",
                "Portfolio-ready projects",
                "Priority scheduling",
                "Ongoing mentorship access",
            ],
            calendlyUrl: "https://calendly.com/metamindsstemacademy/8-hour-mentoring-package-payment-required",
            popular: false,
            gradient: "from-purple-500 to-pink-500",
            bgGradient: "from-purple-50 to-pink-50",
            savings: "Save $80",
        },
    ];

    return (
        <Section id="mentoring" className="bg-white">
            {/* Header */}
            <div className="text-center mb-16 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                >
                    <Zap className="w-4 h-4" />
                    Level Up Your Skills
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                >
                    1-on-1{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Mentoring
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                >
                    Get personalized, one-on-one instruction from our expert instructors. Work on your own projects, learn at your own pace, and get real-time feedback.
                </motion.p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto px-4 mb-16">
                {packages.map((pkg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.1 }}
                        className={`relative group rounded-2xl overflow-hidden border-2 transition-all hover:shadow-2xl ${pkg.popular
                            ? "border-indigo-500 shadow-xl shadow-indigo-100/50 scale-105"
                            : "border-gray-200 hover:border-indigo-300 shadow-lg"
                            }`}
                    >
                        {/* Popular Badge */}
                        {pkg.popular && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black px-4 py-1.5 rounded-bl-xl">
                                MOST POPULAR
                            </div>
                        )}

                        {/* Header */}
                        <div className={`bg-gradient-to-br ${pkg.bgGradient} p-8 text-center`}>
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.gradient} text-white mb-4`}>
                                {pkg.icon}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">{pkg.name}</h3>
                            <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                            <div className="flex items-baseline justify-center gap-2 mb-2">
                                <span className="text-5xl font-black text-gray-900">{pkg.price}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{pkg.duration}</span>
                            </div>
                            {pkg.savings && (
                                <div className="mt-3 inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                    {pkg.savings}
                                </div>
                            )}
                        </div>

                        {/* Features */}
                        <div className="p-8 bg-white">
                            <ul className="space-y-4 mb-8">
                                {pkg.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${pkg.gradient} flex items-center justify-center`}>
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 text-sm leading-tight pt-0.5">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <CalendlyButton
                                url={pkg.calendlyUrl}
                                className={`group/btn w-full bg-gradient-to-r ${pkg.gradient} text-white px-6 py-4 rounded-xl font-bold text-base hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2`}
                            >
                                Book Now
                                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </CalendlyButton>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* What to Expect */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 sm:p-12 max-w-5xl mx-auto border-2 border-gray-200"
            >
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 text-center">
                    What to Expect in Your Session
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                    {[
                        { icon: "🎯", title: "Personalized Learning", desc: "Custom lessons based on your goals and skill level" },
                        { icon: "💻", title: "Live Coding", desc: "Real-time screen sharing and hands-on practice" },
                        { icon: "🚀", title: "Real Projects", desc: "Build portfolio-worthy projects you're proud of" },
                        { icon: "📧", title: "Follow-Up Support", desc: "Resources and guidance between sessions" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="text-4xl flex-shrink-0">{item.icon}</div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                                <p className="text-gray-600 text-sm">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </Section>
    );
}
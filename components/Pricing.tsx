"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Clock, Users, Star, TrendingDown, Gift, Zap } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function Pricing() {
    const tiers = [
        {
            name: "Founding Families",
            price: "$399",
            description: "Next 20 spots only",
            badge: "🔥 Limited Offers Available",
            icon: Sparkles,
            highlighted: false,
            bonuses: [
                "Camp t-shirt",
                "Bonus 3D print toy (Pokémon, keychain, or bookmark)",
                "Extra founding family swag",
                "15% multi-week discount (vs 10% standard)",
                "Priority week selection"
            ],
            savings: "Over $200 in savings",
            availability: "Only 13 spots left!",
            badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
            urgent: true
        },
        {
            name: "Early Bird",
            price: "$495",
            description: "Register before May 1, 2026",
            badge: "⭐ Best Value",
            icon: Clock,
            highlighted: true,
            bonuses: [
                "Camp t-shirt",
                "Bonus 3D print toy (Pokémon, keychain, or bookmark)",
                "10% multi-week discount"
            ],
            savings: "Save $100 vs Standard",
            availability: "Most Popular Choice",
            badgeColor: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
            urgent: false
        },
        {
            name: "Standard",
            price: "$595",
            description: "After May 1, 2026",
            badge: null,
            icon: Users,
            highlighted: false,
            bonuses: [
                "Camp t-shirt"
            ],
            savings: null,
            availability: "Regular pricing",
            badgeColor: null,
            urgent: false
        }
    ];

    // Core features ALL students get (same across all tiers)
    const coreFeatures = [
        "5 full days of camp (9 AM – 3 PM)",
        "Custom robot build to keep ($100 value)",
        "Weekly 3D printed designs ($30+ value)",
        "Coded project portfolio piece",
        "End-of-week gift bag with all creations",
        "Small group instruction (8:1 ratio)",
        "Daily competitions & tournaments",
        "Photo & video highlights",
        "Family showcase presentation"
    ];

    return (
        <Section id="pricing" className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgb(139, 92, 246, 0.15) 1px, transparent 0)`,
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
                        className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                    >
                        <Star className="w-4 h-4" />
                        Same Experience • Better Price
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                    >
                        Lock In Your{" "}
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Best Rate
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-4"
                    >
                        <span className="font-bold text-indigo-600">Every student gets the same premium camp experience.</span> Early
                        registration simply unlocks better pricing and bonus goodies!
                    </motion.p>

                    {/* Value Callout */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg"
                    >
                        <Gift className="w-5 h-5" />
                        <span className="font-bold text-sm sm:text-base">
                            Over $200 in materials • Every student takes home their creations!
                        </span>
                    </motion.div>
                </div>

                {/* What Every Student Gets (Same for All) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto px-4 mb-12"
                >
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-indigo-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
                                Every Student Gets
                            </h3>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                            {coreFeatures.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                                    <span className="text-sm text-gray-700 leading-tight">
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Pricing Tiers Grid - EQUAL HEIGHT */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto px-4 mb-12">
                    {tiers.map((tier, index) => {
                        const Icon = tier.icon;
                        return (
                            <motion.div
                                key={tier.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 flex flex-col ${tier.highlighted
                                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl md:scale-105 border-2 border-indigo-400"
                                    : "bg-white text-gray-900 shadow-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-2xl"
                                    } ${tier.urgent ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
                            >
                                {/* Badge */}
                                {tier.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl ${tier.badgeColor}`}>
                                            {tier.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 ${tier.highlighted
                                    ? "bg-white/20"
                                    : "bg-gradient-to-br from-indigo-100 to-purple-100"
                                    }`}>
                                    <Icon className={`w-7 h-7 ${tier.highlighted ? "text-white" : "text-indigo-600"
                                        }`} />
                                </div>

                                {/* Tier Name */}
                                <h3 className={`text-2xl sm:text-3xl font-black mb-2 ${tier.highlighted ? "text-white" : "text-gray-900"
                                    }`}>
                                    {tier.name}
                                </h3>

                                {/* Description */}
                                <p className={`text-xs sm:text-sm mb-6 font-medium ${tier.highlighted ? "text-indigo-100" : "text-gray-600"
                                    }`}>
                                    {tier.description}
                                </p>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-5xl sm:text-6xl font-black ${tier.highlighted ? "text-white" : "text-gray-900"
                                            }`}>
                                            {tier.price}
                                        </span>
                                        <span className={`text-lg ${tier.highlighted ? "text-indigo-100" : "text-gray-600"
                                            }`}>
                                            /week
                                        </span>
                                    </div>

                                    {/* Savings/Availability */}
                                    <div className="mt-3 space-y-1">
                                        {tier.savings && (
                                            <div className={`flex items-center gap-2 ${tier.highlighted ? "text-yellow-200" : "text-green-600"
                                                }`}>
                                                <TrendingDown className="w-4 h-4" />
                                                <span className="text-sm font-bold">{tier.savings}</span>
                                            </div>
                                        )}
                                        <p className={`text-sm font-semibold ${tier.urgent
                                            ? "text-orange-600"
                                            : tier.highlighted
                                                ? "text-indigo-100"
                                                : "text-indigo-600"
                                            }`}>
                                            {tier.availability}
                                        </p>
                                    </div>
                                </div>

                                {/* Bonus Items - What makes this tier special */}
                                <div className="flex-grow mb-6">
                                    <div className={`flex items-center gap-2 mb-3 ${tier.highlighted ? "text-yellow-200" : "text-purple-600"}`}>
                                        <Gift className="w-5 h-5" />
                                        <h4 className="text-sm font-bold uppercase tracking-wide">
                                            Signup Bonuses
                                        </h4>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {tier.bonuses.map((bonus, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5">
                                                <Sparkles className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.highlighted ? "text-yellow-300" : "text-purple-500"
                                                    }`} />
                                                <span className={`text-xs sm:text-sm leading-tight font-medium ${tier.highlighted ? "text-white" : "text-gray-700"
                                                    }`}>
                                                    {bonus}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA Button - Always at bottom */}
                                <a
                                    href={siteData.hero.formUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block w-full text-center py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 mt-auto ${tier.highlighted
                                        ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl hover:shadow-2xl hover:scale-105"
                                        : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105"
                                        }`}
                                >
                                    {tier.name === "Founding Families" ? "Claim Your Spot Now" : "Reserve Your Spot"}
                                </a>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto px-4 space-y-6"
                >
                    {/* Sibling Discount */}
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border-2 border-indigo-200 text-center">
                        <p className="text-indigo-700 font-bold text-base sm:text-lg mb-2">
                            💙 {siteData.pricing.siblingDiscount}
                        </p>
                        <p className="text-gray-600 text-sm">
                            Applicable to all pricing tiers. Discount applied at checkout.
                        </p>
                    </div>

                    {/* Note */}
                    <p className="text-gray-500 text-xs sm:text-sm text-center">
                        {siteData.pricing.note}
                    </p>
                </motion.div>
            </div>
        </Section>
    );
}
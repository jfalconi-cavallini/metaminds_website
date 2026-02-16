"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Clock, Users } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function Pricing() {
    const tiers = [
        {
            name: "Founding Families",
            price: "$450",
            description: "First 20 spots only",
            badge: "Limited",
            icon: Sparkles,
            highlighted: false,
            features: [
                "5 full days of camp (9 AM – 3 PM)",
                "All robotics equipment provided",
                "Small group instruction (8:1 ratio)",
                "Daily competitions & challenges",
                "Photo & video highlights",
                "End-of-week showcase for families",
                "Exclusive founding family swag",
                "Priority week selection"
            ],
            availability: "Only 20 spots available",
            badgeColor: "bg-amber-500 text-white"
        },
        {
            name: "Early Bird",
            price: "$495",
            description: "Register before May 1, 2026",
            badge: "Best Value",
            icon: Clock,
            highlighted: true,
            features: [
                "5 full days of camp (9 AM – 3 PM)",
                "All robotics equipment provided",
                "Small group instruction (8:1 ratio)",
                "Daily competitions & challenges",
                "Photo & video highlights",
                "End-of-week showcase for families",
                "Camp t-shirt included"
            ],
            availability: "Save $30 per week",
            badgeColor: "bg-indigo-600 text-white"
        },
        {
            name: "Standard Tuition",
            price: "$525",
            description: "After May 1, 2026",
            badge: null,
            icon: Users,
            highlighted: false,
            features: [
                "5 full days of camp (9 AM – 3 PM)",
                "All robotics equipment provided",
                "Small group instruction (8:1 ratio)",
                "Daily competitions & challenges",
                "Photo & video highlights",
                "End-of-week showcase for families"
            ],
            availability: "Regular pricing",
            badgeColor: null
        }
    ];

    return (
        <Section id="pricing" className="bg-gradient-to-b from-white to-indigo-50/30">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Choose Your Plan
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Invest in your child's future with hands-on STEM learning. Lock in the best rate today.
                </p>
            </div>

            {/* Pricing Tiers Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
                {tiers.map((tier, index) => {
                    const Icon = tier.icon;
                    return (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative rounded-2xl p-8 transition-all duration-300 ${tier.highlighted
                                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl scale-105 border-2 border-indigo-400"
                                    : "bg-white text-gray-900 shadow-lg border-2 border-gray-200 hover:border-indigo-300 hover:shadow-xl"
                                }`}
                        >
                            {/* Badge */}
                            {tier.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${tier.badgeColor}`}>
                                        {tier.name === "Founding Families" && <Sparkles className="w-4 h-4" />}
                                        {tier.badge}
                                    </span>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${tier.highlighted
                                    ? "bg-white/20"
                                    : "bg-indigo-100"
                                }`}>
                                <Icon className={`w-6 h-6 ${tier.highlighted ? "text-white" : "text-indigo-600"
                                    }`} />
                            </div>

                            {/* Tier Name */}
                            <h3 className={`text-2xl font-bold mb-2 ${tier.highlighted ? "text-white" : "text-gray-900"
                                }`}>
                                {tier.name}
                            </h3>

                            {/* Description */}
                            <p className={`text-sm mb-6 ${tier.highlighted ? "text-indigo-100" : "text-gray-600"
                                }`}>
                                {tier.description}
                            </p>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-5xl font-black ${tier.highlighted ? "text-white" : "text-gray-900"
                                        }`}>
                                        {tier.price}
                                    </span>
                                    <span className={`text-lg ${tier.highlighted ? "text-indigo-100" : "text-gray-600"
                                        }`}>
                                        /week
                                    </span>
                                </div>
                                <p className={`text-sm mt-2 font-semibold ${tier.highlighted ? "text-indigo-100" : "text-indigo-600"
                                    }`}>
                                    {tier.availability}
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {tier.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.highlighted ? "text-indigo-200" : "text-green-600"
                                            }`} />
                                        <span className={`text-sm ${tier.highlighted ? "text-white" : "text-gray-700"
                                            }`}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <a
                                href={siteData.hero.formUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block w-full text-center py-4 rounded-xl font-bold text-lg transition-all duration-300 ${tier.highlighted
                                        ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
                                    }`}
                            >
                                {tier.name === "Founding Families" ? "Claim Your Spot" : "Reserve Your Spot"}
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
                className="max-w-3xl mx-auto text-center space-y-4"
            >
                <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
                    <p className="text-indigo-700 font-semibold text-lg mb-2">
                        {siteData.pricing.siblingDiscount}
                    </p>
                    <p className="text-gray-600 text-sm">
                        Applicable to all pricing tiers. Discount applied at checkout.
                    </p>
                </div>

                <p className="text-gray-500 text-sm">
                    {siteData.pricing.note}
                </p>
            </motion.div>
        </Section>
    );
}
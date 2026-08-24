"use client";

import { motion } from "framer-motion";

export default function TrustBar() {
    const stats = [
        { label: "Ages 6–14", value: "All Ages" },
        { label: "9 Summer Weeks", value: "9 Programs" },
        { label: "Small Groups (8:1 ratio)", value: "Personalized" },
        { label: "No Experience Needed", value: "Beginner Friendly" },
    ];

    return (
        <section className="py-12 bg-blue-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="text-center"
                        >
                            <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
                            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
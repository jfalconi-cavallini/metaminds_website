"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { siteData } from "@/lib/data";
import Section from "./Section";

export default function DaySchedule() {
    return (
        <Section id="schedule" className="bg-white">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    A Typical Day
                </h2>
                <p className="text-lg text-gray-600">
                    9:00 AM – 3:00 PM, Monday through Friday
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                {siteData.schedule.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200 last:border-0"
                    >
                        <div className="flex items-center gap-3 min-w-[140px]">
                            <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                            <span className="font-semibold text-gray-900">{item.time}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 text-lg">{item.activity}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
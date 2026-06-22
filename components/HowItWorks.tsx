"use client";

import { motion } from "framer-motion";
import { BookOpen, Video, TrendingUp, CheckCircle } from "lucide-react";
import Section from "./Section";

const steps = [
    { icon: BookOpen, step: "1", title: "Book Free Consultation", description: "Tell us your goals and we'll create a plan." },
    { icon: Video, step: "2", title: "Start 1-on-1 Sessions", description: "Real-time feedback and personalized instruction." },
    { icon: TrendingUp, step: "3", title: "Track Progress", description: "Regular check-ins and measurable improvement." },
    { icon: CheckCircle, step: "4", title: "Achieve Your Goals", description: "SAT/ACT scores, coding mastery, and more." },
];

export default function HowItWorks() {
    return (
        <Section className="bg-white">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black text-gray-900 mb-6"
                >
                    How It Works
                </motion.h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {steps.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-black mb-4 mx-auto">
                            {item.step}
                        </div>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-4 mx-auto">
                            <item.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
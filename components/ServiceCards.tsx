"use client";

import { motion } from "framer-motion";
import { BookOpen, Calculator, Code2, Rocket } from "lucide-react";
import Section from "./Section";

const services = [
    {
        icon: BookOpen,
        title: "SAT & ACT Prep",
        description: "Comprehensive test prep with proven score improvements.",
        features: ["Full-length practice tests", "Targeted weak area focus", "Test-day strategy"],
    },
    {
        icon: Calculator,
        title: "K-12 Math Tutoring",
        description: "Master any math topic from algebra to calculus.",
        features: ["All grade levels", "Homework help", "Concept mastery"],
    },
    {
        icon: Code2,
        title: "Coding",
        description: "Learn Python, JavaScript, Java, and web development.",
        features: ["Real projects", "Portfolio building", "Interview prep"],
    },
    {
        icon: Rocket,
        title: "Robotics & More",
        description: "Advanced mentorship in robotics and STEM.",
        features: ["Expert mentors", "Portfolio projects", "Career guidance"],
    },
];

export default function ServiceCards() {
    return (
        <Section id="programs" className="bg-white">
            <div className="text-center mb-16">
                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black text-gray-900 mb-6"
                >
                    Our Programs
                </motion.h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {services.map((service, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4 mx-auto">
                            <service.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-gray-600 text-sm">{service.description}</p>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Section from "./Section";

const testimonials = [
    {
        name: "Sarah Martinez",
        role: "Parent of 10-year-old",
        content: "My son went from barely interested in STEM to building his own robot projects at home. The instructors are incredible and truly care about each child's growth.",
        rating: 5,
    },
    {
        name: "David Chen",
        role: "Parent of 8 & 12-year-old",
        content: "Both my kids attended different tracks and both had amazing experiences. The curriculum is well-designed and age-appropriate. Worth every penny!",
        rating: 5,
    },
    {
        name: "Emily Johnson",
        role: "Parent of 7-year-old",
        content: "I was nervous about sending my daughter to a tech camp, but she absolutely loved it. The small group sizes and patient instructors made all the difference.",
        rating: 5,
    },
];

export default function Testimonials() {
    return (
        <Section id="testimonials" className="bg-white">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    What Parents Say
                </h2>
                <p className="text-lg text-gray-600">
                    Real feedback from families in the DFW community.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.15 }}
                        className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-indigo-100 relative"
                    >
                        <Quote className="absolute top-6 right-6 w-8 h-8 text-indigo-200" />

                        <div className="flex gap-1 mb-4">
                            {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>

                        <p className="text-gray-700 mb-6 leading-relaxed">
                            "{testimonial.content}"
                        </p>

                        <div>
                            <p className="font-bold text-gray-900">{testimonial.name}</p>
                            <p className="text-sm text-gray-600">{testimonial.role}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
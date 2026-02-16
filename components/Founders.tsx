"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";
import Image from "next/image";
import { GraduationCap } from "lucide-react";

export default function Founders() {
    return (
        <Section id="founders" className="bg-white">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    Meet the Founders
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Experienced educators passionate about inspiring the next generation of engineers.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {siteData.founders.map((founder, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.2 }}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
                    >
                        <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-indigo-100">
                            <Image src={founder.image} alt={founder.name} fill className="object-cover" />
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                {founder.name}
                            </h3>
                            <p className="text-indigo-600 font-semibold">{founder.title}</p>
                        </div>

                        <p className="text-gray-600 text-center mb-6 leading-relaxed">
                            {founder.bio}
                        </p>

                        <div className="space-y-3">
                            {founder.credentials.map((credential, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <GraduationCap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 text-sm">{credential}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </Section>
    );
}
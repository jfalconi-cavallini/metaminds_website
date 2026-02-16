"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function RobotBanner() {
    return (
        <section className="relative py-12 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
            {/* Robot Lineup Image */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative w-full h-48 md:h-64"
            >
                <Image
                    src="/images/robot-banner.png" // Replace with your robot lineup image
                    alt="MetaMinds robot creations lineup"
                    fill
                    className="object-contain object-center"
                    priority={false}
                />
            </motion.div>

            {/* Optional: Fun tagline overlay */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >

            </motion.div>
        </section>
    );
}
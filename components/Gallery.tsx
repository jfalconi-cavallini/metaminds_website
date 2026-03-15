"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";
import Image from "next/image";
import { Play, Award, Users, Zap, Code, Cpu, Lightbulb } from "lucide-react";

export default function Gallery() {
    // Elite skill categories with icons
    const skillCategories = [
        {
            icon: Cpu,
            title: "Robot Engineering",
            description: "Build & program real robots",
            color: "from-blue-500 to-indigo-600",
            images: ["/images/robot1.png", "/images/robot2.jpg"]
        },
        {
            icon: Code,
            title: "Programming",
            description: "Code games & applications",
            color: "from-purple-500 to-violet-600",
            images: ["/images/robot3.jpg"]
        },
        {
            icon: Lightbulb,
            title: "3D Design & Printing",
            description: "Create custom inventions",
            color: "from-amber-500 to-orange-600",
            images: ["/images/3dprinting.jpg"]
        },
        {
            icon: Zap,
            title: "Science Experiments",
            description: "Hands-on STEM projects",
            color: "from-emerald-500 to-teal-600",
            images: ["/images/science.png"]
        }
    ];

    return (
        <Section id="gallery" className="bg-white">
            {/* Header */}
            <div className="text-center mb-16 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
                >
                    <Play className="w-4 h-4" />
                    See Them Learn
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight"
                >
                    Real Kids. Real{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Projects
                    </span>
                    .
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                >
                    Watch students master robotics, programming, 3D design, and engineering through
                    hands-on projects they'll be proud to show off.
                </motion.p>
            </div>

            {/* Main Gallery - Unified Grid */}
            <div className="max-w-7xl mx-auto px-4">
                {/* Featured Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12"
                >
                    {[
                        { icon: Users, stat: "500+", label: "Students Taught" },
                        { icon: Award, stat: "100%", label: "Complete Projects" },
                        { icon: Cpu, stat: "4", label: "Age Groups" },
                        { icon: Zap, stat: "8:1", label: "Student Ratio" }
                    ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 text-center border border-purple-100"
                            >
                                <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                                <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">{item.stat}</div>
                                <div className="text-xs sm:text-sm text-gray-600 font-semibold">{item.label}</div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Skill Category Showcases */}
                <div className="space-y-16">
                    {skillCategories.map((category, categoryIdx) => {
                        const Icon = category.icon;
                        const isEven = categoryIdx % 2 === 0;

                        return (
                            <motion.div
                                key={categoryIdx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className={`grid md:grid-cols-2 gap-6 sm:gap-8 items-center ${isEven ? '' : 'md:flex-row-reverse'}`}
                            >
                                {/* Text Content */}
                                <div className={`${isEven ? 'md:order-1' : 'md:order-2'} space-y-4`}>
                                    <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${category.color}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                        <span className="text-white font-bold text-lg">{category.title}</span>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                                        {category.description}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed">
                                        Students don't just learn theory—they build real projects, solve real problems,
                                        and create tangible results they can showcase to friends and family.
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                                            Hands-On Learning
                                        </span>
                                        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                                            Real Projects
                                        </span>
                                        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                                            Take Home & Keep
                                        </span>
                                    </div>
                                </div>

                                {/* Image(s) */}
                                <div className={`${isEven ? 'md:order-2' : 'md:order-1'} ${category.images.length === 1 ? '' : 'grid grid-cols-2 gap-4'
                                    }`}>
                                    {category.images.map((imageSrc, imgIdx) => (
                                        <motion.div
                                            key={imgIdx}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.3 + imgIdx * 0.1 }}
                                            className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                                        >
                                            <Image
                                                src={imageSrc}
                                                alt={category.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 50vw"
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            {/* Gradient overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Additional Gallery Grid - Optional */}
                {siteData.gallery?.images && siteData.gallery.images.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-20"
                    >
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
                            More From Our Camps
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {siteData.gallery.images.slice(0, 8).map((image, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <Image
                                        src={image.src}
                                        alt={image.alt || "Camp activity"}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {image.caption && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-white text-xs sm:text-sm font-medium">
                                                    {image.caption}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-16 pt-12 border-t border-gray-200"
                >
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                        Ready to See Your Child Thrive?
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Join 500+ families who've watched their kids build confidence, skills, and incredible projects.
                    </p>
                    <a
                        href={siteData.hero.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
                    >
                        Reserve Your Spot
                        <Award className="w-5 h-5" />
                    </a>
                </motion.div>
            </div>
        </Section>
    );
}
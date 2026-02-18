"use client";

import { motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Gallery() {
    const [currentPage, setCurrentPage] = useState(0);
    const imagesPerPage = 6;
    const totalPages = Math.ceil(siteData.gallery.images.length / imagesPerPage);

    const paginatedImages = siteData.gallery.images.slice(
        currentPage * imagesPerPage,
        (currentPage + 1) * imagesPerPage
    );

    const masteryCards = [
        {
            src: "/images/robot1.png",
            title: "🤖 Engineer",
            color: "text-indigo-600",
            desc: "Design & build competition robots"
        },
        {
            src: "/images/robot2.jpg",
            title: "💻 Program",
            color: "text-purple-600",
            desc: "Code autonomous behaviors"
        },
        {
            src: "/images/robot3.jpg",
            title: "🏆 Compete",
            color: "text-amber-600",
            desc: "Battle in daily tournaments"
        },
        {
            src: "/images/3dprinting.jpg",
            title: "🎨 3D Print",
            color: "text-cyan-600",
            desc: "Design & print custom creations"
        },
        {
            src: "/images/science.png",
            title: "🔬 Experiment",
            color: "text-green-600",
            desc: "Conduct hands-on science labs"
        },
        {
            src: "/images/ai.jpg",
            title: "🧠 AI Training",
            color: "text-rose-600",
            desc: "Build & train intelligent systems"
        },
    ];

    const goToNextPage = () => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
    };

    const goToPrevPage = () => {
        setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    };

    return (
        <Section id="gallery" className="bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    {siteData.gallery.title}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    {siteData.gallery.subtitle}
                </p>
            </div>

            {/* Featured Mastery Cards */}
            <div className="mb-20">
                <div className="text-center mb-10">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                        What Your Child Will Master
                    </h3>
                    <p className="text-slate-600 text-sm sm:text-base font-medium">
                        Hands-on learning across robotics, coding, 3D design, science & AI
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
                >
                    {masteryCards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative"
                        >
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white ring-1 ring-slate-200">
                                <Image
                                    src={card.src}
                                    alt={card.desc}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                <div className="absolute bottom-5 left-5 right-5">
                                    <div className="bg-white/95 backdrop-blur-md px-5 py-4 rounded-xl shadow-xl">
                                        <p className={`${card.color} font-black text-xl mb-1`}>{card.title}</p>
                                        <p className="text-slate-700 text-sm font-medium">{card.desc}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Divider */}
            <div className="mb-16">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>

            {/* Paginated Gallery Section */}
            <div className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    More From Our Camps
                </h3>
                <p className="text-gray-600">
                    See our students in action
                </p>
            </div>

            {/* Gallery Grid */}
            <motion.div
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
                {paginatedImages.map((image, idx) => (
                    <motion.div
                        key={`${currentPage}-${idx}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <p className="text-white font-semibold text-lg">
                                    {image.caption}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={goToPrevPage}
                        className="p-3 rounded-xl bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-6 h-6 text-slate-700" />
                    </button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx)}
                                className={`w-3 h-3 rounded-full transition-all ${idx === currentPage
                                    ? "bg-indigo-600 w-8"
                                    : "bg-slate-300 hover:bg-slate-400"
                                    }`}
                                aria-label={`Go to page ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={goToNextPage}
                        className="p-3 rounded-xl bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-300 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-6 h-6 text-slate-700" />
                    </button>
                </div>
            )}
        </Section>
    );
}
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { siteData } from "@/lib/data";
import Section from "./Section";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const masteryCards = [
    {
        src: "/images/robot1.png",
        title: "🤖 Engineering",
        color: "text-indigo-600",
        desc: "Design & build competition robots",
    },
    {
        src: "/images/robot2.jpg",
        title: "🏆 Competitions",
        color: "text-purple-600",
        desc: "Battle in daily tournaments",
    },
    {
        src: "/images/robot3.jpg",
        title: "💻 Programming",
        color: "text-amber-600",
        desc: "Code games from scratch",
    },
    {
        src: "/images/3dprinting.jpg",
        title: "🎨 3D Printing",
        color: "text-cyan-600",
        desc: "Design & print custom creations",
    },
    {
        src: "/images/science.png",
        title: "🔬 Experiments",
        color: "text-green-600",
        desc: "Conduct hands-on science labs",
    },
    {
        src: "/images/ai.jpg",
        title: "🧠 AI Training",
        color: "text-rose-600",
        desc: "Build & train intelligent systems",
    },
];

const IMAGES_PER_PAGE = 6;

export default function Gallery() {
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState(0);

    const totalPages = Math.ceil(siteData.gallery.images.length / IMAGES_PER_PAGE);

    const paginatedImages = siteData.gallery.images.slice(
        currentPage * IMAGES_PER_PAGE,
        (currentPage + 1) * IMAGES_PER_PAGE
    );

    const paginate = (e: React.MouseEvent, newPage: number) => {
        e.preventDefault();
        if (newPage === currentPage) return;
        setDirection(newPage > currentPage ? 1 : -1);
        setCurrentPage(newPage);
    };

    const goNext = (e: React.MouseEvent) =>
        paginate(e, (currentPage + 1) % totalPages);
    const goPrev = (e: React.MouseEvent) =>
        paginate(e, (currentPage - 1 + totalPages) % totalPages);

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -60 : 60,
            opacity: 0,
            transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
        }),
    };

    return (
        <Section id="gallery" className="bg-gradient-to-br from-indigo-50 to-purple-50 !pt-8 !pb-16">

            {/* ── Section Header ── */}
            <div className="text-center mb-6">
                <motion.h2
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight"
                >
                    {siteData.gallery.title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.12 }}
                    className="text-base md:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed"
                >
                    {siteData.gallery.subtitle}
                </motion.p>
            </div>

            {/* Decorative accent divider */}
            <div className="flex items-center justify-center gap-3 mb-10">
                <div className="h-px w-14 bg-gradient-to-r from-transparent to-indigo-300" />
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <div className="h-px w-14 bg-gradient-to-l from-transparent to-indigo-300" />
            </div>

            {/* ── Mastery Cards ── */}
            <div className="mb-12">
                <div className="text-center mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 tracking-tight">
                        What Your Child Will Master
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">
                        Hands-on learning across robotics, coding, 3D design, science & AI
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
                    {masteryCards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{ delay: idx * 0.07, duration: 0.45 }}
                            className="group relative"
                        >
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-1 ring-slate-200">
                                <Image
                                    src={card.src}
                                    alt={card.desc}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/10 to-transparent" />
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4">
                                    <div className="bg-white/96 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl shadow-lg">
                                        <p className={`${card.color} font-black text-sm sm:text-lg leading-tight mb-0.5`}>
                                            {card.title}
                                        </p>
                                        <p className="text-slate-600 text-xs sm:text-sm font-medium leading-tight">
                                            {card.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Section divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-10" />

            {/* ── Paginated Gallery ── */}
            <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                    More From Our Camps
                </h3>
                <p className="text-gray-500 text-sm">
                    See our students in action
                </p>
            </div>

            {/* Gallery grid with directional slide */}
            <div className="relative overflow-hidden mb-8">
                <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.div
                        key={currentPage}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                    >
                        {paginatedImages.map((image, idx) => (
                            <div
                                key={`${currentPage}-${idx}`}
                                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                            >
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                                        <p className="text-white font-semibold text-xs sm:text-base leading-snug">
                                            {image.caption}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Previous page"
                        className="p-2.5 sm:p-3 rounded-xl bg-white hover:bg-indigo-50 active:bg-indigo-100 border-2 border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md touch-manipulation"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>

                    <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={(e) => paginate(e, idx)}
                                aria-label={`Go to page ${idx + 1}`}
                                aria-current={idx === currentPage ? "true" : undefined}
                                className={`h-2.5 rounded-full transition-all duration-300 touch-manipulation ${idx === currentPage
                                    ? "bg-indigo-600 w-7"
                                    : "bg-slate-300 hover:bg-slate-400 w-2.5"
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next page"
                        className="p-2.5 sm:p-3 rounded-xl bg-white hover:bg-indigo-50 active:bg-indigo-100 border-2 border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md touch-manipulation"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                    </button>
                </div>
            )}
        </Section>
    );
}
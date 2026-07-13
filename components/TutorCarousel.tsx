"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { siteData } from "@/lib/data";

export default function TutorCarousel() {
    const tutors = siteData.founders || [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);

    // Auto-rotate every 6 seconds
    useEffect(() => {
        if (!autoPlay || tutors.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % tutors.length);
        }, 6000);

        return () => clearInterval(timer);
    }, [autoPlay, tutors.length]);

    const goToPrevious = () => {
        setAutoPlay(false);
        setCurrentIndex((prev) => (prev - 1 + tutors.length) % tutors.length);
    };

    const goToNext = () => {
        setAutoPlay(false);
        setCurrentIndex((prev) => (prev + 1) % tutors.length);
    };

    const currentTutor = tutors[currentIndex];

    if (!currentTutor) return null;

    return (
        <div className="relative w-full max-w-lg">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-3xl blur-2xl" />

            {/* Main carousel card */}
            <div className="relative bg-white/10 backdrop-blur rounded-3xl p-1 border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 sm:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <img
                                src={currentTutor.image}
                                alt={currentTutor.name}
                                className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-2xl mx-auto mb-4"
                            />

                            {/* Tutor Info */}
                            <div className="space-y-2 mb-6">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Founding Tutor</span>
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                </div>
                                <p className="text-white font-bold text-xl sm:text-2xl">{currentTutor.name}</p>
                                <p className="text-blue-300 font-semibold text-sm">{currentTutor.title}</p>
                                
                                {/* Credentials */}
                                <div className="pt-4 border-t border-white/10 mt-4 space-y-1.5">
                                    {currentTutor.credentials?.slice(0, 3).map((cred, i) => {
                                        const isAdvanced = /M\.S\.|MBA|Master/i.test(cred);
                                        return (
                                            <p key={i} className={`text-xs font-bold leading-relaxed flex items-start gap-1.5 ${isAdvanced ? "text-amber-400" : "text-green-400"}`}>
                                                <span className="flex-shrink-0 mt-0.5">{isAdvanced ? "★" : "✓"}</span>
                                                <span>{cred}</span>
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation - Bottom Section */}
                    <div className="space-y-4">
                        {/* Carousel indicators/dots */}
                        <div className="flex justify-center gap-2">
                            {tutors.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setAutoPlay(false);
                                        setCurrentIndex(idx);
                                    }}
                                    className={`h-2 rounded-full transition-all ${
                                        idx === currentIndex
                                            ? "bg-blue-500 w-6"
                                            : "bg-white/30 w-2 hover:bg-white/50"
                                    }`}
                                    aria-label={`Go to tutor ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {/* Arrow buttons */}
                        <div className="flex justify-between items-center gap-3">
                            <button
                                onClick={goToPrevious}
                                className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                                aria-label="Previous tutor"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                                onClick={goToNext}
                                className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                                aria-label="Next tutor"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
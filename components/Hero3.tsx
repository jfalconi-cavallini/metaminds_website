"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { siteData } from "@/lib/data";
import Image from "next/image";

export default function Hero() {
    return (
        <section className="relative h-screen flex flex-col overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-4 pt-4 pb-4">
                <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center">

                    {/* Combined Logo + Robots Image - BIGGER */}
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                        className="relative w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl -mb-16 sm:-mb-20 md:-mb-24"
                    >
                        <div className="relative w-full aspect-[16/7]">
                            <Image
                                src="/images/hero-logo-with-robots.png"
                                alt="Welcome to MetaMinds STEM Academy"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>
                    </motion.div>

                    {/* Quote - VERY TIGHT under logo */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mb-1"
                    >
                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-yellow-300 italic font-bold px-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                            "Ideas are free, Creating has no limits"
                        </p>
                    </motion.div>

                    {/* Info Pills - Compact */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap justify-center items-center gap-1.5 mb-1"
                    >
                        {[
                            { emoji: "👦👧", text: "Ages 6+" },
                            { emoji: "🕐", text: "9-3 PM" },
                            { emoji: "📅", text: "Week-Long" },
                            { icon: <Users className="w-3 h-3" />, text: "8:1" }
                        ].map((pill, i) => (
                            <div key={i} className="bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-lg border-2 border-white/70 flex items-center gap-1 hover:scale-105 transition-transform">
                                {pill.emoji ? <span className="text-xs">{pill.emoji}</span> : pill.icon}
                                <span className="font-black text-gray-800 text-[10px] sm:text-xs">{pill.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* Urgency Banner - Compact */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mb-1"
                    >
                        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black shadow-xl border-2 border-orange-300/50">
                            <span className="text-sm animate-bounce">🔥</span>
                            <span>Save $75/week - Limited Spots</span>
                        </div>
                    </motion.div>

                    {/* 4 Feature Cards - Compact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-1 w-full max-w-6xl"
                    >
                        {[
                            { img: "/images/robot1.png", title: "Build Real Robots", desc: "Design & build robots to take home", gradient: "from-indigo-50 to-purple-50" },
                            { img: "/images/robot3.jpg", title: "Learn to Code", desc: "Real programming from scratch", gradient: "from-purple-50 to-pink-50" },
                            { img: "/images/arduino.jpeg", title: "Actual Learning", desc: "Real problem solving, not tutorials", gradient: "from-blue-50 to-indigo-50" },
                            { img: "/images/3dprinting.jpg", title: "3D Printing", desc: "Design & print custom creations", gradient: "from-amber-50 to-orange-50" }
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + i * 0.08 }}
                                className="bg-white/98 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 hover:scale-105 group border border-white/90"
                            >
                                <div className="relative h-16 sm:h-20 md:h-24 lg:h-28 overflow-hidden">
                                    <Image src={card.img} alt={card.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className={`p-1.5 sm:p-2 bg-gradient-to-br ${card.gradient}`}>
                                    <h3 className="font-black text-gray-900 text-[9px] sm:text-[10px] md:text-xs mb-0.5">{card.title}</h3>
                                    <p className="text-gray-700 text-[7px] sm:text-[8px] md:text-[9px] leading-tight">{card.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Free Scratch Class Banner - Compact */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="mb-1 w-full max-w-4xl"
                    >
                        <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSdcxxB3udLysjnkefuWUAOwTMGa3R37CAHSAQxvAMhfU9r6Wg/viewform"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col sm:flex-row items-center justify-between gap-2 bg-white/25 backdrop-blur-xl border-2 border-white/80 rounded-lg px-3 py-2 hover:bg-white/35 transition-all shadow-xl hover:scale-[1.02]"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg sm:text-xl flex-shrink-0">🎓</span>
                                <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="bg-yellow-400 text-yellow-900 text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-lg">Free</span>
                                        <span className="text-white font-black text-[10px] sm:text-xs drop-shadow-lg">Try Free Scratch Class</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-yellow-400 text-yellow-900 font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-lg group-hover:bg-yellow-300 transition-all shadow-lg flex items-center gap-1 whitespace-nowrap">
                                Sign Up
                                <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>
                    </motion.div>

                    {/* Main CTAs - Compact */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex flex-col sm:flex-row gap-2 justify-center items-center w-full max-w-lg"
                    >
                        <a
                            href={siteData.hero.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto bg-white text-indigo-600 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-black text-[10px] sm:text-xs hover:bg-gray-50 transition-all shadow-xl hover:scale-105 active:scale-100 flex items-center justify-center gap-1 group"
                        >
                            Reserve Your Spot
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="#programs"
                            className="w-full sm:w-auto bg-white/25 backdrop-blur-xl text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-black text-[10px] sm:text-xs hover:bg-white/35 transition-all shadow-xl border-2 border-white/80 hover:scale-105 active:scale-100 text-center"
                        >
                            View Programs
                        </a>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
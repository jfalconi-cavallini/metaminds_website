"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { siteData } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);

            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            setScrollProgress(scrolled);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-white/95 backdrop-blur-lg shadow-md"
                    : "bg-white/50 backdrop-blur-sm"
            )}
        >
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    <Link href="/" className="flex items-center">
                        <img
                            src="/images/metaminds-logo.png"
                            alt="MetaMinds STEM Academy"
                            className="h-12 md:h-40 w-auto"
                        />
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {siteData.nav.map((item) => (
                            <a key={item.href} href={item.href} className="text-gray-600 hover:text-indigo-600 font-medium transition-colors relative group">
                                {item.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
                            </a>
                        ))}
                        <a href={siteData.hero.formUrl} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105">
                            Register Now
                        </a>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div className="px-4 py-4 space-y-3">
                        {siteData.nav.map((item) => (
                            <a key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="block text-gray-600 hover:text-indigo-600 font-medium py-2">
                                {item.label}
                            </a>
                        ))}
                        <a href={siteData.hero.formUrl} target="_blank" rel="noopener noreferrer" className="block text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all">
                            Register Now
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
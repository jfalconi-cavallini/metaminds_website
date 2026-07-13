"use client";

import Link from "next/link";
import { siteData } from "@/lib/data";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import CalendlyButton from "./CalendlyButton";

const navLinks = siteData.nav.map((item) => ({
    ...item,
    href: `/${item.href}`,
}));

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full h-20 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white shadow-sm"}`}>
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                    <img src="/images/metaminds-logo2.png" alt="MetaMinds STEM Academy" className="h-20 w-auto object-contain" />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-6">
                    {navLinks.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="hidden lg:flex items-center gap-3">
                    <Link
                        href="/login"
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                        Sign In
                    </Link>
                    <CalendlyButton className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm">
                        Free Consultation
                    </CalendlyButton>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
                    <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block text-gray-700 font-medium py-2.5 px-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-sm transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="pt-3 pb-1 flex flex-col gap-2">
                            <Link
                                href="/login"
                                className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg text-center text-sm hover:bg-gray-50"
                                onClick={() => setIsOpen(false)}
                            >
                                Sign In
                            </Link>
                            <CalendlyButton className="w-full px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-center text-sm hover:bg-blue-700">
                                Book Free Consultation
                            </CalendlyButton>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

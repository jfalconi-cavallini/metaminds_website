import Link from "next/link";
import { siteData } from "@/lib/data";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h3 className="text-white font-bold text-xl mb-4">
                            {siteData.brand.name}
                        </h3>
                        <p className="text-sm leading-relaxed">
                            Empowering the next generation of engineers through hands-on
                            robotics education in the DFW area.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            {siteData.nav.map((item) => (
                                <li key={item.href}>
                                    <a href={item.href} className="hover:text-white transition-colors">
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <Link href="/privacy" className="hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href={`mailto:${siteData.brand.email}`} className="hover:text-white transition-colors">
                                    {siteData.brand.email}
                                </a>
                            </li>
                            <li>{siteData.brand.location}</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-sm">
                    <p>
                        © {new Date().getFullYear()} {siteData.brand.name}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
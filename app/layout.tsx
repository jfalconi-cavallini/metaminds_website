import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteData } from "@/lib/data";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${siteData.brand.name} | DFW Robotics Summer Camp`,
  description: siteData.brand.description,
  openGraph: {
    title: "MetaMinds STEM Academy — Robotics Summer Camp",
    description: "Build robots, learn to code & 3D print. Ages 6+, 9AM–3PM. Limited founding spots from $399/week.",
    url: "https://www.metamindsstemacademy.com/",
    siteName: "MetaMinds STEM Academy",
    images: [
      {
        url: "https://www.metamindsstemacademy.com/images/metaminds-logo-mobile.png",
        width: 1200,
        height: 630,
        alt: "MetaMinds STEM Academy — Kids building robots",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
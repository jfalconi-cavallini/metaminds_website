import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { siteData } from "@/lib/data";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${siteData.brand.name} | ${siteData.brand.tagline}`,
  description: siteData.brand.description,
  openGraph: {
    title: `MetaMinds STEM Academy — ${siteData.brand.tagline}`,
    description: siteData.brand.description,
    url: "https://www.metamindsstemacademy.com/",
    siteName: "MetaMinds STEM Academy",
    images: [
      {
        url: "https://www.metamindsstemacademy.com/images/metaminds-logo2.png",
        width: 1200,
        height: 630,
        alt: "MetaMinds STEM Academy — Expert STEM Tutoring",
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
      <head>
        <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-MHFJLNT58X" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-MHFJLNT58X');
        `}</Script>
        {children}
      </body>
    </html>
  );
}
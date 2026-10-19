import type { NextConfig } from "next";
import { legacyRedirects, staticRewrites } from "./lib/games";

const nextConfig: NextConfig = {
  async redirects() {
    return legacyRedirects.map((entry) => ({
      source: entry.source,
      destination: entry.destination,
      permanent: true,
    }));
  },
  async rewrites() {
    return {
      beforeFiles: staticRewrites.map((entry) => ({
        source: entry.source,
        destination: entry.destination,
      })),
    };
  },
};

export default nextConfig;

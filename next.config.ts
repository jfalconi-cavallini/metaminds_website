import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/games/palabras-park",
        destination: "/games/palabras-park/index.html",
      },
      {
        source: "/games/palabras-park/",
        destination: "/games/palabras-park/index.html",
      },
    ];
  },
};

export default nextConfig;

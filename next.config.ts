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
      {
        source: "/games/verbo-rush",
        destination: "/games/verbo-rush/index.html",
      },
      {
        source: "/games/verbo-rush/",
        destination: "/games/verbo-rush/index.html",
      },
      {
        source: "/games/lanza-loros",
        destination: "/games/lanza-loros/index.html",
      },
      {
        source: "/games/lanza-loros/",
        destination: "/games/lanza-loros/index.html",
      },
    ];
  },
};

export default nextConfig;

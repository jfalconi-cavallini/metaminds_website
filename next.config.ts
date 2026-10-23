import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Campaign short links. permanent: false is a 307 so these stay temporary
    // when a campaign changes. UTMs are on the destination so the browser lands
    // on a URL GA4's default gtag page_view can read.
    return [
      {
        source: "/crunch",
        destination: "/?utm_source=crunch&utm_medium=gym_tv",
        permanent: false,
      },
      {
        source: "/crunch-consult",
        destination: "/consultation?utm_source=crunch&utm_medium=gym_tv",
        permanent: false,
      },
    ];
  },
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

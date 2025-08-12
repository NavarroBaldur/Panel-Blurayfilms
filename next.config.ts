import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "localhost",
      "127.0.0.1",
      "ehtwuxuwinsoyrsusuyu.supabase.co",
      "placehold.co",
      "image.tmdb.org",
    ],
    unoptimized: true, // 👈 Esto desactiva la optimización de imágenes
  },
};

export default nextConfig;
import type { NextConfig } from "next";

const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  images: {
    // Las imágenes vienen del bucket público de R2; next/image las optimiza (webp/avif).
    remotePatterns: r2PublicUrl ? [new URL(`${r2PublicUrl}/**`)] : [],
    // Las imágenes no cambian (cada subida tiene una key nueva).
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow serving uploaded images from public/uploads
  images: {
    remotePatterns: [],
  },
  // Suppress server-side warnings for optional deps
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;

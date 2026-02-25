import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // output: "export", // Commented out to enable Server Actions (File Upload) in Dev. Re-enable for Static Build.
  images: {
    unoptimized: true, // Required for Cloudflare Pages unless using a specific loader
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Configured for Railway Dockerfile deployment
export default nextConfig;

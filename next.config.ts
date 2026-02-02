import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;

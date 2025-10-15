import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for static export to AWS Amplify
  output: 'export',
  
  // Image optimization configuration for static export
  // Static export doesn't support Next.js Image Optimization API
  // Images will be served as-is without optimization
  images: {
    unoptimized: true,
  },
  
  // Disable trailing slashes for cleaner URLs
  trailingSlash: false,
};

export default nextConfig;

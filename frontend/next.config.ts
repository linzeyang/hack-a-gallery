import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // SSR enabled - removed static export configuration
  // This enables Server-Side Rendering for improved SEO and performance

  // Image optimization configuration for SSR
  // Now supports Next.js Image Optimization API
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },

  // Disable trailing slashes for cleaner URLs
  trailingSlash: false,
};

export default withNextIntl(nextConfig);

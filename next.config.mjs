import { getAutomationImageRemotePatterns } from './src/lib/automationImage.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // MCQ extractor uploads PDFs via /api/mcq-extractor/extract (middleware buffers the body).
    middlewareClientMaxBodySize: "50mb",
  },
  images: {
    remotePatterns: getAutomationImageRemotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

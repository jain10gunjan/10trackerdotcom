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
};

export default nextConfig;

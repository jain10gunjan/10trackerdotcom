/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // MCQ extractor uploads PDFs via /api/mcq-extractor/extract (middleware buffers the body).
    middlewareClientMaxBodySize: "50mb",
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gateoverflow.in' },
      { protocol: 'https', hostname: '10tracker.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;

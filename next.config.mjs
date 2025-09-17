/** @type {import('next').NextConfig} */
const nextConfig = {
  // For static hosting (cPanel, etc.)
  output: process.env.BUILD_MODE === "static" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  // For dynamic hosting (Vercel, VPS, etc.)
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;

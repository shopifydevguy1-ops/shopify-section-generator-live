/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from ALL serverless function bundles
  // Files are still deployed and accessible at runtime via filesystem
  // This prevents bundling 277MB of images into each function
  outputFileTracingExcludes: {
    '*': [
      'sections/images/**',
      'sections/images/**/*',
    ],
  },
  // Allow images from API routes
  images: {
    remotePatterns: [],
    unoptimized: true, // We're using unoptimized in components, but set globally too
  },
}

module.exports = nextConfig


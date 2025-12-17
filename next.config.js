/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from serverless function bundles
  // Following Vercel's guide: https://vercel.com/kb/guide/troubleshooting-function-250mb-limit
  // Use output path format (without .js extension) to match build output
  outputFileTracingExcludes: {
    // Exclude images from ALL routes (including image route)
    // Images will be served from Vercel Blob Storage instead of filesystem
    // This prevents the 250MB limit error
    '*': [
      'sections/images/**',
      'sections/images/mobile/**',
    ],
  },
  // Allow images from API routes
  images: {
    remotePatterns: [],
    unoptimized: true, // We're using unoptimized in components, but set globally too
  },
}

module.exports = nextConfig


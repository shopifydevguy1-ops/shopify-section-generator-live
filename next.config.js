/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from serverless function bundles
  // Following Vercel's guide: https://vercel.com/kb/guide/troubleshooting-function-250mb-limit
  // Use output path format (without .js extension) to match build output
  outputFileTracingExcludes: {
    // Exclude images from routes that don't need them
    // Use the output path format that matches the build
    'api/generate': [
      'sections/images/**',
      'sections/images/mobile/**',
    ],
    'api/sections/list': [
      'sections/images/**',
      'sections/images/mobile/**',
    ],
    'api/sections/search': [
      'sections/images/**',
      'sections/images/mobile/**',
    ],
    'api/templates': [
      'sections/images/**',
      'sections/images/mobile/**',
    ],
    // NOTE: api/sections/images/[...path] is NOT excluded
    // This allows it to access images at runtime, but it will still be large
    // Consider moving to external storage if this exceeds 250MB
  },
  // Allow images from API routes
  images: {
    remotePatterns: [],
    unoptimized: true, // We're using unoptimized in components, but set globally too
  },
}

module.exports = nextConfig


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from serverless function bundles
  // Following Vercel's guide: https://vercel.com/kb/guide/troubleshooting-function-250mb-limit
  // According to Vercel: Files excluded from tracing are still deployed and accessible
  // at runtime via filesystem - they're just not bundled into the function
  // Use excludeFiles in vercel.json for function-specific exclusions
  outputFileTracingExcludes: {
    // Exclude images from routes that don't need them (reduces bundle size)
    // The image serving route (app/api/sections/images) is NOT excluded here
    // so it can access images at runtime via filesystem
    'app/api/generate/route': [
      'sections/images/**',
    ],
    'app/api/sections/list/route': [
      'sections/images/**',
    ],
    'app/api/sections/search/route': [
      'sections/images/**',
    ],
    'app/api/templates/route': [
      'sections/images/**',
    ],
  },
  // Allow images from API routes
  images: {
    remotePatterns: [],
    unoptimized: true, // We're using unoptimized in components, but set globally too
  },
}

module.exports = nextConfig


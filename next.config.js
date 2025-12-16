/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from serverless function bundles
  // Following Vercel's guide: https://vercel.com/kb/guide/troubleshooting-function-250mb-limit
  // Exclude from routes that don't need images, but allow image route to access them
  outputFileTracingExcludes: {
    // Exclude images from routes that don't need them
    // The image serving route is NOT excluded so it can access files
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
    // NOTE: app/api/sections/images/[...path]/route is NOT in exclusions
    // This allows it to access images at runtime
  },
  // Allow images from API routes
  images: {
    remotePatterns: [],
    unoptimized: true, // We're using unoptimized in components, but set globally too
  },
}

module.exports = nextConfig


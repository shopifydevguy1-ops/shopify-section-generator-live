/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from serverless function bundles
  // BUT: We need to ensure the image serving route can access them
  // Exclude from all routes EXCEPT the image serving route
  outputFileTracingExcludes: {
    // Exclude images from routes that don't need them
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
    // NOTE: app/api/sections/images route is NOT in this list
    // so it will have access to images at runtime
  },
  // Allow images from API routes
  images: {
    remotePatterns: [],
    unoptimized: true, // We're using unoptimized in components, but set globally too
  },
}

module.exports = nextConfig


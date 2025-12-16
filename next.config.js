/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from serverless function bundles
  // This reduces bundle size while keeping images accessible at runtime
  // Images are served via /api/sections/images route which needs file access
  outputFileTracingExcludes: {
    // Exclude images from routes that don't need them bundled
    'app/api/generate/route': [
      'sections/images/**/*',
    ],
    'app/api/sections/list/route': [
      'sections/images/**/*',
    ],
    'app/api/sections/search/route': [
      'sections/images/**/*',
    ],
    'app/api/templates/route': [
      'sections/images/**/*',
    ],
    // Note: app/api/sections/images route is NOT excluded so it can access files
  },
}

module.exports = nextConfig


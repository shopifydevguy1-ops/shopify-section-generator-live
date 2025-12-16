/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from serverless function bundles
  // Images are served dynamically via API routes at runtime, not bundled
  outputFileTracingExcludes: {
    '*': [
      'sections/images/**/*',
    ],
  },
}

module.exports = nextConfig


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel supports full Next.js features including API routes
  trailingSlash: true,
  // Exclude large image directories from ALL serverless function bundles
  // Following Vercel's guide: https://vercel.com/kb/guide/troubleshooting-function-250mb-limit
  // CRITICAL: Files excluded from tracing are STILL DEPLOYED and accessible at runtime
  // via filesystem using fs.readFileSync() - they're just not bundled into functions
  // This prevents the 250MB limit while still allowing runtime access
  outputFileTracingExcludes: {
    // Exclude images from ALL routes using wildcard
    // Use both relative and absolute patterns to ensure exclusion works
    '*': [
      './sections/images/**',
      'sections/images/**',
      '**/sections/images/**',
    ],
  },
  // Allow images from API routes
  images: {
    remotePatterns: [],
    unoptimized: true, // We're using unoptimized in components, but set globally too
  },
}

module.exports = nextConfig


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    'bcryptjs',
    '@prisma/client',
    '@prisma/adapter-pg',
    'prisma',
    '.prisma',
    '.prisma/client',
  ],
  // Use webpack instead of Turbopack to avoid Prisma type stripping issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Completely externalize Prisma packages - they will be loaded at runtime only
      config.externals = config.externals || [];
      
      // Externalize as a function to handle all Prisma-related modules
      const originalExternal = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternal) ? originalExternal : [originalExternal]),
        ({ request }: { request?: string }, callback: (err: null | Error, result?: string) => void) => {
          // Externalize all Prisma-related packages
          if (
            request === '@prisma/client' ||
            request === '@prisma/adapter-pg' ||
            request?.includes('.prisma') ||
            request?.includes('prisma/client')
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback(undefined as any);
        },
      ];
      
      // Add resolve alias to ensure Prisma is not processed
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client$': '@prisma/client',
      };
    }
    return config;
  },
};

export default nextConfig;

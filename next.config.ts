import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Increase memory limits for build
  experimental: {
    // Help with build stability
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Webpack configuration to handle memory issues
  webpack: (config, { isServer }) => {
    // Increase memory limits
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;

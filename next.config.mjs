import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM equivalent of __dirname (next.config.mjs is an ES module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: 500 * 1024 * 1024, // 500MB
    },
  },
  reactCompiler: true,

  // Fix workspace root detection when a parent directory also has a lockfile.
  // This also satisfies the "turbopack config alongside webpack config" requirement
  // in Next.js 16, preventing the hard build error.
  turbopack: {
    root: __dirname,
  },

  // Allow Next.js Image Optimization to load from external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Webpack fallbacks — only used when building with --webpack flag.
  // Turbopack handles server/client code splitting automatically,
  // so these Node.js-only modules are excluded from client bundles without extra config.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        "pg-native": false,
      };
    }
    return config;
  },
};

export default nextConfig;


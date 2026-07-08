import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // ⚠️  Previously set to 500 MB — drastically reduced to close a
      // resource-exhaustion attack vector.  Raise only if you have a
      // specific, justified need (e.g. PDF/video upload flows should use
      // pre-signed S3 URLs directly instead of routing through Next.js).
      bodySizeLimit: 10 * 1024 * 1024, // 10 MB
    },
  },

  reactCompiler: true,

  // Fix workspace root detection when a parent directory also has a lockfile.
  turbopack: {
    root: __dirname,
  },

  // ── HTTP Security Headers ──────────────────────────────────────────────
  // Applied at the CDN/edge level by Vercel in addition to the middleware
  // headers (middleware runs per-request on the origin edge worker).
  async headers() {
    return [
      {
        // Apply to every route
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Static assets — allow aggressive caching but lock down embedding
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control',         value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        // API routes — never cache, enforce JSON content type checking
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control',         value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // Allow Next.js Image Optimization to load from external sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co'       },
      { protocol: 'https', hostname: '**.supabase.in'       },
      { protocol: 'https', hostname: '**.amazonaws.com'     },
      { protocol: 'https', hostname: '**.cloudfront.net'    },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Webpack fallbacks — only used when building with --webpack flag.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net:          false,
        tls:          false,
        fs:           false,
        dns:          false,
        child_process: false,
        'pg-native':  false,
      };
    }
    return config;
  },
};

export default nextConfig;

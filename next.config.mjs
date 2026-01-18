/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: 500 * 1024 * 1024, // 500MB
    },
  },
  reactCompiler: true,
};

export default nextConfig;

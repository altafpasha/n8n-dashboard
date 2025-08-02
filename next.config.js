/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = [...config.externals, { 'bufferutil': 'commonjs bufferutil', 'utf-8-validate': 'commonjs utf-8-validate' }];
    }
    return config;
  },
};

module.exports = nextConfig;

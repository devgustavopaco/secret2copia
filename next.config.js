/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  reactStrictMode: true,
  experimental: {
    esmExternals: false,
    forceSwcTransforms: false,
  },
};

module.exports = nextConfig;

module.exports = {
  webpack5: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
};

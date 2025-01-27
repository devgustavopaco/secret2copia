/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  reactStrictMode: true,
  compiler: {
    styledComponents: false,
    removeConsole: false,
  },
  experimental: {
    esmExternals: false,
    forceSwcTransforms: false,
    swcTraceProfiling: false,
    swcMinifyDebugOptions: {
      compress: false,
      mangle: false,
    },
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    config.optimization = {
      ...config.optimization,
      minimize: false,
    };
    return config;
  },
};

module.exports = nextConfig;
//dd

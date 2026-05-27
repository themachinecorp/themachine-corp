import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  output: 'export',
  basePath: '/crown',
  assetPrefix: '/',
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

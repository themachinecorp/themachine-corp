import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  output: 'export',
  basePath: '/crown',
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

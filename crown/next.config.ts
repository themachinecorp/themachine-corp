import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  // Keep basePath so all CROWN routes are under /crown/ on CF Pages SSR
  basePath: '/crown',
  assetPrefix: '/crown',
  trailingSlash: true,
};

export default nextConfig;
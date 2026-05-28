import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  // Keep basePath so all CROWN assets and routes resolve under /crown/
  basePath: '/crown',
  assetPrefix: '/crown',
  trailingSlash: true,
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  // Keep basePath so internal assets resolve correctly under /crown/
  // when deployed to themachine-corp.pages.dev/crown/
  basePath: '/crown',
  assetPrefix: '/crown',
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
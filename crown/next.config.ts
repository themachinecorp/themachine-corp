import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

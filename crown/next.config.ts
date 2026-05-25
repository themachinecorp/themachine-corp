import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
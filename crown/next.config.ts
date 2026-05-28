import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  trailingSlash: true,
  // Note: output: 'export' removed for multi-user SSR support.
  // Use `wrangler pages deploy .next` on Cloudflare Pages.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
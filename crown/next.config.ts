import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: true,
  // CROWN serves at root — basePath removed for unified multi-product auth
  trailingSlash: true,
};

export default nextConfig;
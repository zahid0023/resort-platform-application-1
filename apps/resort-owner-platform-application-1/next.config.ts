import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["ui-blocks", "@resort/shadcn-ui"],
  turbopack: {},
};

export default nextConfig;

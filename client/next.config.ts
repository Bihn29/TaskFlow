import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.0.105", "localhost", "127.0.0.1"],
};

export default nextConfig;

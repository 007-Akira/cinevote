import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.29.93",
    "192.168.29.93:3000",
    "http://192.168.29.93:3000",
  ],
};

export default nextConfig;

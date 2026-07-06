import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.29.93",
    "192.168.29.93:3000",
    "http://192.168.29.93:3000",
    "192.168.64.101",
    "192.168.64.101:3000",
    "http://192.168.64.101:3000",
    "192.168.64.101:3001",
    "http://192.168.64.101:3001",
  ],
};

export default nextConfig;

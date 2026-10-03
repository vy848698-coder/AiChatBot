import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets phones on the same Wi-Fi open the dev server by LAN IP.
  allowedDevOrigins: ["192.168.1.4", "192.168.*.*"],
};

export default nextConfig;

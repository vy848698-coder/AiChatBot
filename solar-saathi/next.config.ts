import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets phones on the same Wi-Fi open the dev server by LAN IP.
  allowedDevOrigins: ["192.168.1.4", "192.168.*.*"],
  // SMTP mail sending uses Node's net/tls directly; load it as-is.
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;

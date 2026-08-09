import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ProAgent Web is a decoupled client of the ProAgent backend.
  // The API host is provided at runtime via NEXT_PUBLIC_API_URL so the same
  // build can target local dev, the current VPS, or a future dedicated VPS.
  reactStrictMode: true,
};

export default nextConfig;

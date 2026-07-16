import type { NextConfig } from "next";

/**
 * Azure Static Web Apps expects a static artifact folder (we use `out`).
 * App Service can still use standalone via BUILD_TARGET=appservice.
 */
const target = process.env.BUILD_TARGET ?? "swa";

const nextConfig: NextConfig = {
  // SWA: static files in `out/`  |  App Service: Node standalone server
  output: target === "appservice" ? "standalone" : "export",
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;

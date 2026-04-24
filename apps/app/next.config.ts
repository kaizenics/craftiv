import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/resume/pdf": ["../../node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/cover-letter/pdf": ["../../node_modules/@sparticuz/chromium/bin/**/*"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

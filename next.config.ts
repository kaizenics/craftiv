import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/resume/pdf": ["./node_modules/playwright-core/.local-browsers/**/*"],
    "/api/resume/pdf/route": ["./node_modules/playwright-core/.local-browsers/**/*"],
    "/api/cover-letter/pdf": ["./node_modules/playwright-core/.local-browsers/**/*"],
    "/api/cover-letter/pdf/route": ["./node_modules/playwright-core/.local-browsers/**/*"],
  },
};

export default nextConfig;

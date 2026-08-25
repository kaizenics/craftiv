import type { NextConfig } from "next";

// pdf.js resolves its worker at runtime and the parsing routes reach it through
// a dynamic import, so tracing cannot see the dependency. Both routes that read
// an upload need the package present in the standalone output.
const PDFJS_FILES = [
  "./node_modules/pdfjs-dist/legacy/build/**/*",
  "./node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/legacy/build/**/*",
];

const PLAYWRIGHT_CORE_FILES = [
  "./node_modules/playwright-core/**/*",
  "./node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/**/*",
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  // Left to Node's own resolution rather than bundled: pdf.js loads its worker
  // by path at runtime, which does not survive being packed into a chunk.
  serverExternalPackages: ["pdfjs-dist"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com";

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
      "form-action 'self'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(isProd
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
        : []),
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:path*\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // Tracing copies playwright-core's JS but not the data files it reads at
  // runtime (browsers.json), so the routes that launch Chromium ask for the
  // package wholesale. The .pnpm path is the real directory — node_modules/
  // playwright-core is only a symlink to it, which the glob will not walk.
  outputFileTracingIncludes: {
    "/api/resume/pdf": PLAYWRIGHT_CORE_FILES,
    "/api/cover-letter/pdf": PLAYWRIGHT_CORE_FILES,
    "/api/cover-letter/export": PLAYWRIGHT_CORE_FILES,
    "/api/resume/parse": PDFJS_FILES,
    "/api/ats-check": PDFJS_FILES,
  },
};

export default nextConfig;

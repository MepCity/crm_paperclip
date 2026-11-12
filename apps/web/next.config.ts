import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const monorepoRoot = fileURLToPath(new URL("../..", import.meta.url));

const config: NextConfig = {
  // Internal packages are consumed as TypeScript source.
  transpilePackages: ["@crm/core", "@crm/db"],
  serverExternalPackages: ["pg"],
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/portal/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin()(config);

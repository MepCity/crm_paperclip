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
};

export default createNextIntlPlugin()(config);

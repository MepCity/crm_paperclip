/**
 * Shared helper for identifying background requests initiated by the persistent
 * application shell (such as chat sync polling, presence, and contact refreshes),
 * which run across all pages independently of module-specific data requests.
 *
 * Refs: MEP-1420, ADR 0015 §2
 */

export const SHELL_BACKGROUND_PATH_PATTERNS: readonly RegExp[] = [
  /^\/crm\/v[\d.]+\/chat\/(sync|contacts|presence)/,
];

export function isShellBackgroundRequest(requestOrUrl: string | { pathname: string }): boolean {
  try {
    const pathname =
      typeof requestOrUrl === "string"
        ? requestOrUrl.startsWith("http://") || requestOrUrl.startsWith("https://")
          ? new URL(requestOrUrl).pathname
          : requestOrUrl
        : requestOrUrl.pathname;
    return SHELL_BACKGROUND_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

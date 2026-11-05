/**
 * Shared helper for identifying background requests initiated by the persistent
 * application shell (such as chat sync polling, presence, and contact refreshes,
 * or calendar event loading from the top-bar shortcut), which run across all
 * pages independently of module-specific data requests.
 *
 * Refs: MEP-1420, MEP-1436, ADR 0015 §2
 */

export const SHELL_BACKGROUND_PATH_PATTERNS: readonly RegExp[] = [
  /^\/crm\/v[\d.]+\/chat\/(sync|contacts|presence)/,
  /^\/crm\/v[\d.]+\/Events\/bulk$/,
  /^\/crm\/v[\d.]+\/notifications\/unseen_count$/,
];

export function isShellBackgroundRequest(
  requestOrUrl: string | { url?: () => string; pathname?: string },
): boolean {
  try {
    let pathname: string;
    if (typeof requestOrUrl === "string") {
      pathname = new URL(requestOrUrl, "http://localhost").pathname;
    } else if (typeof requestOrUrl?.url === "function") {
      pathname = new URL(requestOrUrl.url(), "http://localhost").pathname;
    } else if (requestOrUrl?.pathname) {
      pathname = requestOrUrl.pathname;
    } else {
      return false;
    }
    return SHELL_BACKGROUND_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

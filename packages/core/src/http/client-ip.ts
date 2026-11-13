/** True when the deployment sits behind a trusted reverse proxy (`TRUST_PROXY=1|true`). */
export function isProxyTrusted(env: Record<string, string | undefined> = process.env): boolean {
  const value = env.TRUST_PROXY?.trim().toLowerCase();
  return value === "1" || value === "true";
}

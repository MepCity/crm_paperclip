/** Temporary local credentials; remove before deployment (MEP-963). */
export const DEV_ADMIN_EMAIL = "admin@mepcity.local";

export function isDevLoginEnabled(env: { NODE_ENV?: string; APP_URL?: string }): boolean {
  if (env.NODE_ENV === "production" || !env.APP_URL) return false;
  try {
    const url = new URL(env.APP_URL);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

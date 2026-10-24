import { getSession } from "@crm/core";
import { supportedLanguage } from "@/i18n/resolve-language";
import { persistLanguage, readSavedLanguage } from "@/server/personal-settings/language";

function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    if (originUrl.origin === requestUrl.origin) return true;
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host && originUrl.host === host) return true;
    if (process.env.APP_URL && originUrl.origin === new URL(process.env.APP_URL).origin)
      return true;
    return false;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const session = await getSession(request.headers);
  if (!session) return Response.json({ code: "UNAUTHENTICATED" }, { status: 401 });
  return Response.json(
    { language: (await readSavedLanguage(session.user.id)) ?? "en" },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PUT(request: Request) {
  if (!isValidOrigin(request)) return Response.json({ code: "INVALID_ORIGIN" }, { status: 403 });
  const session = await getSession(request.headers);
  if (!session) return Response.json({ code: "UNAUTHENTICATED" }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    Object.keys(body).some((key) => key !== "language") ||
    !supportedLanguage((body as { language?: unknown }).language)
  )
    return Response.json({ code: "INVALID_LANGUAGE" }, { status: 400 });
  const language = supportedLanguage((body as { language: unknown }).language);
  if (!language) return Response.json({ code: "INVALID_LANGUAGE" }, { status: 400 });
  try {
    await persistLanguage(session.user.id, language);
  } catch {
    return Response.json({ code: "SAVE_FAILED" }, { status: 500 });
  }
  return Response.json({ language }, { headers: { "Cache-Control": "private, no-store" } });
}

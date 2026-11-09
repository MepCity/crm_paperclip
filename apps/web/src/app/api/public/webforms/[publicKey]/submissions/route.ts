import { getClientIp, isSameOrigin, resolvePublicForm, submitWebform } from "@crm/core/webforms";
import { exemptRoute } from "@/lib/access/route-permission";

export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 32 * 1024; // 32 KB

function getAppPublicOrigin(request?: Request): string {
  if (process.env.APP_URL) {
    try {
      return new URL(process.env.APP_URL).origin.toLowerCase();
    } catch {
      // ignore
    }
  }
  if (request) {
    try {
      return new URL(request.url).origin.toLowerCase();
    } catch {
      // ignore
    }
  }
  return "http://127.0.0.1:3000";
}

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderThankYouHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Submission Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .icon { width: 48px; height: 48px; border-radius: 50%; background: #ecfdf5; color: #10b981; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; font-size: 24px; font-weight: bold; }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a; }
    p { color: #64748b; font-size: 0.95rem; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Thank You</h1>
    <p id="thank-you-message">${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function renderValidationErrorHtml(errors?: Record<string, string[]>): string {
  const errorItems = errors
    ? Object.entries(errors)
        .flatMap(([_field, msgs]) => msgs)
        .map((m) => `<li style="margin-bottom: 0.25rem;">${escapeHtml(m)}</li>`)
        .join("\n")
    : "<li>Validation failed.</li>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Submission Error</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border: 1px solid #fecaca; border-radius: 8px; padding: 2.5rem; max-width: 480px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; color: #dc2626; }
    ul { color: #991b1b; font-size: 0.875rem; padding-left: 1.25rem; margin: 0 0 1.5rem 0; line-height: 1.5; }
    .btn { display: inline-block; background: #f1f5f9; color: #334155; text-decoration: none; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .btn:hover { background: #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Please fix the following:</h1>
    <ul>
      ${errorItems}
    </ul>
    <button type="button" class="btn" onclick="history.back()">Go back</button>
  </div>
</body>
</html>`;
}

function renderRateLimitHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Too Many Requests</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #ef4444; }
    p { color: #64748b; font-size: 0.95rem; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Too Many Requests</h1>
    <p>Rate limit exceeded. Please try again later.</p>
  </div>
</body>
</html>`;
}

function renderNotFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Form Unavailable</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a; }
    p { color: #64748b; font-size: 0.95rem; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Form Unavailable</h1>
    <p>The form you are looking for is unavailable, inactive, or does not exist.</p>
  </div>
</body>
</html>`;
}

function getCorsHeaders(
  request: Request,
  restrictLocations: boolean,
  allowedLocations: { origin: string }[],
): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");

  if (!origin) {
    return headers;
  }

  const isAllowed =
    !restrictLocations ||
    allowedLocations.some((l) => l.origin.toLowerCase() === origin.toLowerCase());

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
    headers.set("Access-Control-Max-Age", "86400");
  }

  return headers;
}

export const OPTIONS = exemptRoute(
  "public",
  "Webform submission CORS preflight",
  async (
    request: Request,
    { params }: { params: Promise<{ publicKey: string }> },
  ): Promise<Response> => {
    const { publicKey } = await params;
    const resolved = await resolvePublicForm(publicKey);
    if (!resolved) {
      return new Response(null, { status: 404 });
    }

    const headers = getCorsHeaders(
      request,
      resolved.version.settings.restrictLocations,
      resolved.locations,
    );

    if (
      resolved.version.settings.restrictLocations &&
      !headers.has("Access-Control-Allow-Origin")
    ) {
      return new Response(null, { status: 403 });
    }

    return new Response(null, { status: 204, headers });
  },
);

export const POST = exemptRoute(
  "public",
  "Webform submission ingestion",
  async (
    request: Request,
    { params }: { params: Promise<{ publicKey: string }> },
  ): Promise<Response> => {
    const { publicKey } = await params;

    // 1. Content-Length check
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return new Response("Payload Too Large", { status: 413 });
    }

    // 2. Parse body
    const contentType = request.headers.get("content-type") || "";
    let data: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      const rawText = await request.text();
      if (rawText.length > MAX_PAYLOAD_BYTES) {
        return new Response("Payload Too Large", { status: 413 });
      }
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const rawText = await request.text();
      if (rawText.length > MAX_PAYLOAD_BYTES) {
        return new Response("Payload Too Large", { status: 413 });
      }
      const searchParams = new URLSearchParams(rawText);
      for (const [key, value] of searchParams.entries()) {
        data[key] = value;
      }
    } else if (contentType.includes("multipart/form-data")) {
      try {
        const formData = await request.formData();
        for (const [key, value] of formData.entries()) {
          if (typeof value === "string") {
            data[key] = value;
          }
        }
      } catch {
        return new Response("Payload Too Large or Malformed", { status: 413 });
      }
    } else {
      // Default to text / json attempt
      const rawText = await request.text();
      if (rawText.length > MAX_PAYLOAD_BYTES) {
        return new Response("Payload Too Large", { status: 413 });
      }
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        const searchParams = new URLSearchParams(rawText);
        for (const [key, value] of searchParams.entries()) {
          data[key] = value;
        }
      }
    }

    const ip = getClientIp(request);
    const appOrigin = getAppPublicOrigin(request);
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // Origin header takes precedence: if Origin is present, it must match appOrigin to be considered hosted.
    let isHostedRoute = false;
    const originMatchesApp = origin ? isSameOrigin(origin, appOrigin) : true;

    if (originMatchesApp && referer) {
      try {
        const refUrl = new URL(referer);
        if (
          isSameOrigin(refUrl.origin, appOrigin) &&
          refUrl.pathname.startsWith(`/f/${publicKey}`)
        ) {
          isHostedRoute = true;
        }
      } catch {
        // ignore malformed referer
      }
    }

    // Call ingestion pipeline
    const result = await submitWebform({
      publicKey,
      data,
      origin,
      referer,
      isHostedRoute,
      appOrigin,
      ip,
    });

    // Form lookup for CORS headers
    const resolved = await resolvePublicForm(publicKey);
    const corsHeaders = resolved
      ? getCorsHeaders(request, resolved.version.settings.restrictLocations, resolved.locations)
      : new Headers();

    const isJsonClient =
      request.headers.get("accept")?.includes("application/json") ||
      contentType.includes("application/json");

    if (result.outcome === "rate_limited") {
      corsHeaders.set("Retry-After", "60");
      if (isJsonClient) {
        return Response.json(
          { error: "Rate limit exceeded" },
          { status: 429, headers: corsHeaders },
        );
      }
      return new Response(renderRateLimitHtml(), {
        status: 429,
        headers: {
          ...Object.fromEntries(corsHeaders.entries()),
          "Content-Type": "text/html; charset=utf-8",
          "Retry-After": "60",
        },
      });
    }

    if (result.outcome === "unavailable" || result.outcome === "rejected_location") {
      if (isJsonClient) {
        return Response.json({ error: "Form unavailable" }, { status: 404, headers: corsHeaders });
      }
      return new Response(renderNotFoundHtml(), {
        status: 404,
        headers: {
          ...Object.fromEntries(corsHeaders.entries()),
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    if (result.outcome === "invalid") {
      if (isJsonClient) {
        return Response.json(
          { error: "Validation failed", errors: result.errors },
          { status: 422, headers: corsHeaders },
        );
      }
      return new Response(renderValidationErrorHtml(result.errors), {
        status: 422,
        headers: {
          ...Object.fromEntries(corsHeaders.entries()),
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // Success / Accepted / Spam / Pending outcomes
    if (isJsonClient) {
      return Response.json(
        { success: true, acknowledgement: result.acknowledgement },
        { status: 200, headers: corsHeaders },
      );
    }

    // Standard HTML form POST
    if (result.acknowledgement?.kind === "redirect" && result.acknowledgement.url) {
      return Response.redirect(result.acknowledgement.url, 303);
    }

    const thankYouText =
      result.acknowledgement?.kind === "message"
        ? result.acknowledgement.text
        : "Thank you for your submission.";

    return new Response(renderThankYouHtml(thankYouText), {
      status: 200,
      headers: {
        ...Object.fromEntries(corsHeaders.entries()),
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  },
);

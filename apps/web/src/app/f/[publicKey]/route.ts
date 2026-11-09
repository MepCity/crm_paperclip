import {
  checkRateLimit,
  computeClientHash,
  createRenderToken,
  generateChallenge,
  getClientIp,
  getEligibleFieldsForModule,
  type OrgContext,
  recordVisit,
  resolvePublicForm,
  type Transaction,
  withOrg,
} from "@crm/core";
import { exemptRoute } from "@/lib/access/route-permission";

export const dynamic = "force-dynamic";

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderNotFoundHtml(isTr = false): string {
  return `<!DOCTYPE html>
<html lang="${isTr ? "tr" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${isTr ? "Form Kullanılamıyor" : "Form Unavailable"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #0f172a; }
    p { color: #64748b; font-size: 0.95rem; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${isTr ? "Form Kullanılamıyor" : "Form Unavailable"}</h1>
    <p>${
      isTr
        ? "Aradığınız form kullanılamıyor, devre dışı veya mevcut değil."
        : "The form you are looking for is unavailable, inactive, or does not exist."
    }</p>
  </div>
</body>
</html>`;
}

function renderRateLimitHtml(isTr = false): string {
  return `<!DOCTYPE html>
<html lang="${isTr ? "tr" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${isTr ? "Çok Fazla İstek" : "Too Many Requests"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #ef4444; }
    p { color: #64748b; font-size: 0.95rem; margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${isTr ? "Çok Fazla İstek" : "Too Many Requests"}</h1>
    <p>${
      isTr
        ? "İstek sınırı aşıldı. Lütfen daha sonra tekrar deneyin."
        : "Rate limit exceeded. Please try again later."
    }</p>
  </div>
</body>
</html>`;
}

export const GET = exemptRoute(
  "public",
  "Hosted webform public page",
  async (
    request: Request,
    { params }: { params: Promise<{ publicKey: string }> },
  ): Promise<Response> => {
    const { publicKey } = await params;
    const acceptLang = request.headers.get("accept-language") || "";
    const isTr = acceptLang.toLowerCase().includes("tr");

    const resolved = await resolvePublicForm(publicKey);
    if (!resolved) {
      return new Response(renderNotFoundHtml(isTr), {
        status: 404,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const ip = getClientIp(request);
    const clientHash = computeClientHash(ip);

    const ctx: OrgContext = {
      orgId: resolved.form.organizationId,
      orgSlug: "public-render",
      orgName: "Public Render",
      userId: "00000000-0000-0000-0000-000000000000",
      role: "member",
    };

    // Rate limit check for render
    const rateLimitCheck = await withOrg(ctx, (tx: Transaction) =>
      checkRateLimit(tx, {
        orgId: resolved.form.organizationId,
        formId: resolved.form.id,
        clientHash,
        isRender: true,
      }),
    );

    if (!rateLimitCheck.allowed) {
      return new Response(renderRateLimitHtml(isTr), {
        status: 429,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Retry-After": "60",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // Record visit (location is 'hosted' for hosted form)
    await recordVisit(resolved.form.organizationId, resolved.form.id, "hosted");

    // CSP frame-ancestors
    let frameAncestors = "*";
    if (resolved.version.settings.restrictLocations) {
      const allowlist = resolved.locations.map((l) => l.origin);
      if (allowlist.length === 0) {
        frameAncestors = "'none'";
      } else {
        frameAncestors = `'self' ${allowlist.join(" ")}`;
      }
    }

    // Challenge
    let challengeSvg: string | null = null;
    let challengeHash: string | undefined;
    if (resolved.version.settings.challenge) {
      const ch = generateChallenge();
      challengeSvg = ch.svg;
      challengeHash = ch.challengeHash;
    }

    // Render token
    const token = createRenderToken({
      orgId: resolved.form.organizationId,
      formId: resolved.form.id,
      versionId: resolved.version.id,
      issuedAt: Date.now(),
      challengeHash,
    });

    const eligibleFields = getEligibleFieldsForModule(resolved.form.module);
    const fieldDefMap = new Map(eligibleFields.map((f) => [f.apiName, f]));

    const visibleFields = resolved.version.fields.filter((f) => !f.hidden);
    const formFieldsHtml = visibleFields
      .map((field) => {
        const requiredAttr = field.required ? ' required aria-required="true"' : "";
        const requiredBadge = field.required
          ? ' <span class="required" aria-hidden="true" style="color: #ef4444;">*</span>'
          : "";
        const helpHtml = field.helpText
          ? `<div class="field-help" style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">${escapeHtml(field.helpText)}</div>`
          : "";

        const fieldDef = fieldDefMap.get(field.fieldApiName);
        let inputHtml = "";

        if (fieldDef?.picklistOptions && fieldDef.picklistOptions.length > 0) {
          const optionsHtml = [
            `<option value="">${isTr ? "-- Seçin --" : "-- Select --"}</option>`,
            ...fieldDef.picklistOptions.map((opt) => {
              const isSelected = field.defaultValue === opt.storedValue ? " selected" : "";
              return `<option value="${escapeHtml(opt.storedValue)}"${isSelected}>${escapeHtml(opt.displayValue)}</option>`;
            }),
          ].join("\n            ");

          inputHtml = `
          <select
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; background: white;"
          >
            ${optionsHtml}
          </select>`;
        } else if (fieldDef?.dataType === "textarea") {
          inputHtml = `
          <textarea
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            ${requiredAttr}
            rows="4"
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; resize: vertical;"
          >${escapeHtml(field.defaultValue || "")}</textarea>`;
        } else if (
          fieldDef?.dataType === "number" ||
          fieldDef?.dataType === "integer" ||
          fieldDef?.dataType === "double" ||
          fieldDef?.dataType === "currency"
        ) {
          const step = fieldDef.dataType === "integer" ? ' step="1"' : ' step="any"';
          inputHtml = `
          <input
            type="number"${step}
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="${escapeHtml(field.defaultValue ?? "")}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />`;
        } else if (fieldDef?.dataType === "date") {
          inputHtml = `
          <input
            type="date"
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="${escapeHtml(field.defaultValue ?? "")}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />`;
        } else if (fieldDef?.dataType === "datetime") {
          inputHtml = `
          <input
            type="datetime-local"
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="${escapeHtml(field.defaultValue ?? "")}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />`;
        } else if (fieldDef?.dataType === "email") {
          inputHtml = `
          <input
            type="email"
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="${escapeHtml(field.defaultValue ?? "")}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />`;
        } else if (fieldDef?.dataType === "phone") {
          inputHtml = `
          <input
            type="tel"
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="${escapeHtml(field.defaultValue ?? "")}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />`;
        } else if (fieldDef?.dataType === "url" || fieldDef?.dataType === "website") {
          inputHtml = `
          <input
            type="url"
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="${escapeHtml(field.defaultValue ?? "")}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
          />`;
        } else if (fieldDef?.dataType === "boolean") {
          const isChecked = field.defaultValue === true ? " checked" : "";
          inputHtml = `
          <input
            type="checkbox"
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="true"${isChecked}
            style="size: 1rem; margin-top: 0.25rem;"
          />`;
        } else {
          inputHtml = `
          <input
            type="text"
            id="field-${escapeHtml(field.fieldApiName)}"
            name="${escapeHtml(field.fieldApiName)}"
            value="${escapeHtml(field.defaultValue ?? "")}"
            ${requiredAttr}
            style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; transition: border-color 0.15s ease;"
          />`;
        }

        return `
        <div class="field-group" style="margin-bottom: 1.25rem;">
          <label for="field-${escapeHtml(field.fieldApiName)}" style="display: block; font-size: 0.875rem; font-weight: 500; color: #334155; margin-bottom: 0.375rem;">
            ${escapeHtml(field.label)}${requiredBadge}
          </label>
          ${inputHtml}
          ${helpHtml}
        </div>`;
      })
      .join("\n");

    const challengeHtml = challengeSvg
      ? `
      <div class="field-group challenge-group" style="margin-bottom: 1.25rem;">
        <label for="field-_challenge" style="display: block; font-size: 0.875rem; font-weight: 500; color: #334155; margin-bottom: 0.375rem;">
          ${isTr ? "Doğrulama Kodu" : "Verification Code"} <span class="required" aria-hidden="true" style="color: #ef4444;">*</span>
        </label>
        <div style="margin-bottom: 0.5rem; display: inline-block;">
          ${challengeSvg}
        </div>
        <input
          type="text"
          id="field-_challenge"
          name="_challenge"
          required
          aria-required="true"
          autocomplete="off"
          placeholder="${isTr ? "Yukarıdaki kodu girin" : "Enter code above"}"
          style="width: 100%; box-sizing: border-box; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none;"
        />
      </div>`
      : "";

    const attributionHtml = resolved.version.settings.captureAttribution
      ? `
      <input type="hidden" name="gclid" id="mep-attr-gclid" />
      <input type="hidden" name="utm_source" id="mep-attr-utm-source" />
      <input type="hidden" name="utm_medium" id="mep-attr-utm-medium" />
      <input type="hidden" name="utm_campaign" id="mep-attr-utm-campaign" />
      <input type="hidden" name="utm_term" id="mep-attr-utm-term" />
      <input type="hidden" name="utm_content" id="mep-attr-utm-content" />
      <script>
        (function() {
          try {
            var params = new URLSearchParams(window.location.search);
            var keys = ["gclid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
            for (var i = 0; i < keys.length; i++) {
              var val = params.get(keys[i]);
              if (val) {
                var el = document.getElementById("mep-attr-" + keys[i].replace("_", "-"));
                if (el) el.value = val;
              }
            }
          } catch (e) {}
        })();
      </script>`
      : "";

    const defaultBtnLabel = isTr ? "Gönder" : "Submit";
    const submitBtnLabel = resolved.version.settings.buttonLabel || defaultBtnLabel;

    const html = `<!DOCTYPE html>
<html lang="${isTr ? "tr" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(resolved.form.name)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 1.5rem 1rem; display: flex; justify-content: center; }
    .form-container { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2rem; max-width: 540px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 1.5rem 0; color: #0f172a; }
    .submit-btn { width: 100%; background: #2563eb; color: white; border: none; border-radius: 6px; padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background-color 0.15s ease; }
    .submit-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="form-container">
    <h1>${escapeHtml(resolved.form.name)}</h1>
    <form method="POST" action="/api/public/webforms/${encodeURIComponent(publicKey)}/submissions" id="mep-webform">
      <input type="hidden" name="_token" value="${escapeHtml(token)}" />
      <div style="display:none !important; opacity:0; position:absolute; left:-9999px;">
        <input type="text" name="_hp" tabindex="-1" autocomplete="off" />
      </div>
      ${attributionHtml}
      ${formFieldsHtml}
      ${challengeHtml}
      <button type="submit" class="submit-btn">${escapeHtml(submitBtnLabel)}</button>
    </form>
  </div>
</body>
</html>`;

    const headers = new Headers();
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Content-Security-Policy", `frame-ancestors ${frameAncestors};`);
    headers.set("Cache-Control", "no-store, max-age=0");
    if (frameAncestors === "'none'") {
      headers.set("X-Frame-Options", "DENY");
    }

    return new Response(html, {
      status: 200,
      headers,
    });
  },
);

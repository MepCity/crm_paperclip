import { getSession, type OrgContext, parseEnv, requireOrgContext } from "@crm/core";
import {
  ForbiddenError,
  isAppError,
  UnauthenticatedError,
  ValidationError,
} from "@crm/core/errors";
import { encodeError } from "./wire/errors";

export type ApiHandlerInput<Params extends Record<string, string>> = {
  ctx: OrgContext;
  request: Request;
  params: Params;
  query: Record<string, string>;
};

type ApiHandler<Params extends Record<string, string>> = (
  input: ApiHandlerInput<Params>,
) => Promise<unknown>;

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Wraps a `/crm/v…` route handler.
 *
 * Checks run in this order, and there is no redirect:
 * 1. Every method other than `GET` must send `Origin` equal to the `APP_URL` origin.
 * 2. A session must exist.
 * 3. The `X-CRM-ORG` header must be present.
 * 4. `requireOrgContext` must resolve that organization for this session.
 *
 * `null` becomes 204 with no body. Any other return value becomes 200 JSON.
 * An `AppError` uses the shared error codec. Any other throw is 500 with empty
 * `details`; the cause is logged and is not written on the response.
 * Every response is `Cache-Control: no-store`. No CORS header is set.
 */
export function apiRoute<Params extends Record<string, string>>(handler: ApiHandler<Params>) {
  return async (request: Request, context: { params?: Promise<Params> }): Promise<Response> => {
    try {
      assertSameOrigin(request);
      const session = await getSession(request.headers);
      if (!session) throw new UnauthenticatedError();
      const orgSlug = request.headers.get("X-CRM-ORG");
      if (orgSlug === null || orgSlug.trim() === "") {
        throw new ValidationError({ organization: ["An organization header is required."] });
      }
      const ctx = await requireOrgContext(request.headers, orgSlug);
      const params = (await context.params) ?? ({} as Params);
      const result = await handler({ ctx, request, params, query: readQuery(request) });
      if (result === null) return new Response(null, { status: 204, headers: NO_STORE });
      return Response.json(result, { status: 200, headers: NO_STORE });
    } catch (error) {
      if (!isAppError(error)) console.error("Unexpected API error", error);
      const encoded = encodeError(error);
      return Response.json(encoded.body, { status: encoded.status, headers: NO_STORE });
    }
  };
}

function assertSameOrigin(request: Request): void {
  if (request.method.toUpperCase() === "GET") return;
  const origin = request.headers.get("Origin");
  const expected = new URL(parseEnv(process.env).APP_URL).origin;
  if (origin !== expected) throw new ForbiddenError();
}

/** First value for each key. Keys the handler does not read are ignored. */
function readQuery(request: Request): Record<string, string> {
  const query = Object.create(null) as Record<string, string>;
  for (const [key, value] of new URL(request.url).searchParams) {
    if (query[key] === undefined) query[key] = value;
  }
  return query;
}

# API handlers

`apiRoute` in `server.ts` is the only place that authenticates a `/crm/v…` handler.
The organization slug travels in the `X-CRM-ORG` header. It is read per request and
is not session state. Only this wrapper, its tests and this document know that name.

## Order

1. For every method other than `GET`, `Origin` must equal the origin of `APP_URL`
   (scheme, host and port, compared as exact strings). Otherwise `403`.
2. Without a session, `401`. The wrapper does not redirect.
3. Without `X-CRM-ORG`, or when the header is blank, `400`.
4. `requireOrgContext` from `@crm/core` loads the organization. An unknown
   organization or a user who is not a member is `404`.

The handler receives `{ ctx, request, params, query }`. A query key it does not read
is ignored. Repeated keys keep the first value.

Return `null` for `204` with no body, or any other value for `200` JSON. Throw an
`AppError` for an expected failure. Any other error is `500` with empty `details`;
the detail is written only to the server log. Error bodies use the codec in
`wire/` (see `wire/README.md` for the observed keys and the interim `code` values).

Every response sets `Cache-Control: no-store`. No CORS header is set.

## Writing a handler

A route file is the wrapper plus one service call. Do not read the session or the
organization header there.

```ts
import { ValidationError } from "@crm/core/errors";
import { apiRoute } from "./server";
import { getRecordService } from "../records";

export const POST = apiRoute<{ module: string }>(async ({ ctx, params, query }) => {
  const viewId = query.cvid;
  if (!viewId) throw new ValidationError({ cvid: ["Choose a view."] });
  return { count: await getRecordService(ctx).count(params.module, { viewId }) };
});
```

`POST /crm/v2.2/{module}/actions/count` is that pattern. `cvid` is required. The
request body is not read.

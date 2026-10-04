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
import { listMembers } from "@crm/core";
import { apiRoute } from "@/lib/api/server";
import { operations } from "@/lib/api/wire/operations";
import { getRecordService } from "@/lib/records";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (input) => (
  await operations.count.run({ records: getRecordService(input.ctx), members: await listMembers(input.ctx) }, input)
).body);
```

The count route now delegates to `operations.count`. The operation validates
`cvid` (a missing value is keyed by the port's `viewId`) and optionally reads
JSON `{ filters?, search? }`. Paths and methods are defined only by the inventory
in `wire/operations.ts`; the browser can use `operationPath` to build URLs.
